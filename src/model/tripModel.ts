import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const tripSchema = new Schema(
    {
        pickup: {
            type: String,
            required: true,
        },
        destination: {
            type: String,
            required: true,
        },
        passenger: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
