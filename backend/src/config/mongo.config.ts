import mongoose from 'mongoose';
import { env } from './env.config';
import logger from './logger.config';

const connectDB = async () => {
    try {
        const dbURI = env.MONGODB_URI;
        if(!dbURI) {
            throw new Error("MONGODB_URI is not defined in .env");
        }
        await mongoose.connect(dbURI);
        logger.info("Database connected successfully ❇️");
        
    } catch (error) {
        logger.error("Database Connection Error", error);
    }
};

export default connectDB;