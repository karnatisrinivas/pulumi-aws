exports.lambdaHandler = async (event, context) => {
    let response;

    try {
        const path = event.path;
        const method = event.httpMethod;

        switch (true) {
            case method === 'GET' && path === '/status':
                response = buildResponse(200, { message: 'Service is operational' });
                break;
            case method === 'GET' && path === '/hello':
                response = buildResponse(200, { message: 'Hello, world!' });
                break;
            case method === 'GET' && path === '/goodbye':
                response = buildResponse(200, { message: 'Goodbye, world!' });
                break;
            default:
                response = buildResponse(404, { message: '404 Not Found' });
        }
    } catch (error) {
        console.error('Error: ', error);
        response = buildResponse(500, { message: 'Internal Server Error' });
    }

    return response;
};

const buildResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
};
