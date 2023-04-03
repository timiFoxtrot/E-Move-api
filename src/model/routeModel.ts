import mongoose from "mongoose";


const RouteSchema = new mongoose.Schema({
  pickup: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

const Route = mongoose.model('Route', RouteSchema);

export default Route;