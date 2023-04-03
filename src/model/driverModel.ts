import { truncate } from "fs/promises";
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const driverSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    operationRoute: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true
    },
    accountNo: {
      type: Number,
      required: true
    },
    driverId: {
      type: String,
      required: true
    },
    photo: {
      type: String,
      required: true
    }
});

const Driver = mongoose.model("driver", driverSchema);

export default Driver