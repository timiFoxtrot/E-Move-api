import mongoose from "mongoose";

const Schema = mongoose.Schema;

const donorSchema = new Schema({
  name: {type: String, required: true},
  reference: {type: String, required: true},
  amount: {type: Number, required: true},
  email: {type: String, required: true}
})

const Donor = mongoose.model("donor", donorSchema);
export default Donor