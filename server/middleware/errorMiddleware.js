const errorHandler = (err, req, res, next) => {
    console.error(`❌ [Error] ${err.message}`);
    
    
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        error: {
            code: err.name || 'SERVER_ERROR',
            message: err.message || 'An unexpected error occurred.',
        }
    });
};

export default errorHandler;
