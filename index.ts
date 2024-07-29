import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";

// Define the IAM role for the Lambda function
const lambdaRole = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: pulumi.output({
        Version: "2012-10-17",
        Statement: [
            {
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "lambda.amazonaws.com",
                },
            },
        ],
    }).apply(JSON.stringify),
});

// Attach a policy to the IAM role
const lambdaRolePolicy = new aws.iam.RolePolicyAttachment("lambdaRolePolicyAttachment", {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole", // Basic Lambda execution role
});



// Define the Lambda function
const lambdaFunction = new aws.lambda.Function("myLambdaFunction", {
    name: "srini-test",
    runtime: aws.lambda.Runtime.NodeJS16dX,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.FileAsset(path.join(__dirname, "lambda/index.js")), // Path to the compiled JavaScript code
    }),
    handler: "index.lambdaHandler",
    role: lambdaRole.arn,
});

// Export the Lambda function name
export const lambdaName = lambdaFunction.name;
export const lambdaArn = lambdaFunction.arn;

// Create API Gateway with routes

const testApiGateway = new aws.apigateway.RestApi("srini-test", {
    name: "srini-test"
})

const resource= new aws.apigateway.Resource("status",{
    restApi: testApiGateway.id,
    parentId: testApiGateway.rootResourceId,
    pathPart: "status"
})


const statusMetod = new aws.apigateway.Method("getStatus", {
    restApi: testApiGateway.id,
    resourceId:  resource.id,
    httpMethod: "GET",
    authorization: "NONE"
})


const statusIntegration= new aws.apigateway.Integration("statusIntegration",{
    restApi: testApiGateway.id,
    resourceId:  resource.id,
    httpMethod: statusMetod.httpMethod,
    type: "AWS_PROXY",
    uri: lambdaFunction.invokeArn,
    integrationHttpMethod: "POST" 
})


const statusDeployment = new aws.apigateway.Deployment("statusDeployment", {
    restApi: testApiGateway.id,
    stageName: "dev"
}, { dependsOn: [statusMetod,statusIntegration]}) 

const invokePermissions = new aws.lambda.Permission("invokePermission", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.arn,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${testApiGateway.executionArn}/*/*/*`
})

