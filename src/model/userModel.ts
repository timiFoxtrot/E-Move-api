import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const UserSchema = new Schema(
  {
    name: { type: String, min: 3, required: true, max: 255 },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: any) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
      },
    },
    password: { type: String, required: true },
    verified: {
      type: Boolean,
      default: false,
    },
    phone: { type: Number, required: true },
    isAdmin: { type: Boolean, default: false },
    gender: { type: String, required: true },
    DOB: { type: String, required: true },
    walletBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model('user', UserSchema);
export default User;
