import { NextFunction, Request, Response } from 'express';
import User from '../model/userModel';
import Token from '../model/tokenModel';

import Route from '../model/routeModel';

import { toHash } from '../utils/passwordHashing';
import { sendEmail } from '../utils/email.config';
import crypto from 'crypto';
import Joi from 'joi';
import { getToken, loginToken } from '../utils/token';
import { compare } from '../utils/passwordHashing';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { initializePayment, verifyPayment } from '../utils/paystack';
import Donor from '../model/donorModel';
import _ from 'lodash';
import Transaction from '../model/transactionModel';
import { loginSchema, userSchema } from '../utils/joiValidator';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userData = req.body;
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message,
      });
    }

    let getExistingUsers = await User.findOne({
      email: req.body.email,
    });

    if (getExistingUsers) {
      return res.status(400).send({
        message: 'User already exists',
      });
    }

    const hashedPassword = await toHash(userData.password);

    const {ADMIN1_EMAIL, ADMIN2_EMAIL} = process.env
    const adminArray = [ADMIN1_EMAIL, ADMIN2_EMAIL]

    const allUserData = {
      ...userData,
      isAdmin: adminArray.includes(req.body.email) ? true : false,
      password: hashedPassword,
    };

    console.log(allUserData);
    const userSaved = await new User(allUserData).save();
    console.log('userSaved', userSaved);
    const token = await new Token({
      userId: userSaved._id,
      token: getToken(userSaved._id),
    }).save();
    console.log(token);

    const url = `${process.env.BASE_URL}/users/verify/${userSaved._id}/${token.token}`;
    const html = `<h1>Email Verification</h1>
        <h2>Hello ${userSaved.name}</h2>
        <p>Click the link below to verify mail</p>
        <a href=${url}>verify mail</a>
        </div>`;
    await sendEmail(userSaved.email, 'Verify email', html);
    
    return res.status(201).send({
      status: 'success',
      message: 'An email has been sent to your account please verify',
      userId: userSaved._id,
      token: token.token,
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).send({
      status: 'error',
    });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
    });

    if (!user) {
      return res.status(404).send({
        message: 'Invalid link',
      });
    }

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!token) {
      return res.status(404).send({
        message: 'Invalid link',
      });
    }

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          verified: true,
        },
      }
    );

    await token.remove();

    // return res.status(200).send({
    //   success: true,
    //   status: 'success',
    //   message: 'Email verified successfully',
    // });
    res.redirect('http://localhost:3000/users/verify')
  } catch (error) {
    return res.status(500).send({
      status: 'error',
    });
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if(error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message
      })
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send({message: 'Invalid email'});

    const isMatch = await compare(user.password, req.body.password);
    if (!isMatch) return res.status(400).send({message: 'Invalid password'});

    if (!user.verified) return res.status(400).send({message: 'User not verified'});

    const token = loginToken(user._id.toString());

    res.status(200).send({
      message: 'login successful',
      user,
      loginToken: token,
    });
  } catch (error) {
    res.status(500).send('Error occured');
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: 'fill required password' });
  }

  const { authorization } = req.headers;
  if (!authorization) {
    console.log('auth fired');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Get the JWT token from the authorization header
  const token = authorization.split(' ')[1];
  const secret: string = process.env.JWTLOGINSECRET as string;

  // Decode the JWT and extract the user ID
  try {
    const decoded: { _id: string } = (await jwt.verify(token, secret)) as {
      _id: string;
    };
    if (!decoded) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const userId = decoded._id;

    try {
      // Find the user by their ID
      const user = await User.findById(userId);
      if (user) {
        // Check if the current password matches
        const passwordMatches = await bcrypt.compare(
          currentPassword,
          user.password
        );
        if (!passwordMatches) {
          return res
            .status(400)
            .json({ error: 'Current password is incorrect' });
        }
        // Check if the new password and confirmation match
        if (newPassword !== confirmNewPassword) {
          return res.status(400).json({ error: 'New passwords do not match' });
        }
        // Hash the new password and save it to the database
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        // Send a success response
        return res.status(200).json({
          message: 'Password updated successfully',
          status: 'sucess',
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = Joi.object({ email: Joi.string().email().required() });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).send("user with given email doesn't exist");

    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString('hex'),
      }).save();
    }

    const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
    await sendEmail(user.email, 'Password reset', link);
    //send password reset link to email

    res.send('password reset link sent to your email account');
  } catch (error) {
    res.send('An error occured');
    console.log(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = Joi.object({ password: Joi.string().required() });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).send('invalid link or expired');

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send('Invalid link or expired');

    user.password = req.body.password;
    await user.save();
    await token.delete();

    res.send('password reset sucessfully.');
  } catch (error) {
    res.send('An error occured');
    console.log(error);
  }
};

export const getAllRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const routes = await Route.find();
    res.send(routes);
  } catch (error) {
    res.send('An error occured');
    console.log(error);
  }
};

export const getRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const route = await Route.findById(req.params.id);
    res.send(route);
  } catch (error) {
    res.send('An error occured');
    console.log(error);
  }
};

export const initPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.send('Invalid user');
    }
    const form: any = {};
    form.name = user.name;
    form.email = user.email;
    form.metadata = {
      full_name: user.name,
    };
    form.amount = amount * 100;

    initializePayment(form, async (error: any, body: any) => {
      if (error) {
        return res.send('payment error occurred');
      }

      const response = JSON.parse(body);

      const newTransaction = {
        userId: req.userId,
        transactionType: 'Credit',
        amount: form.amount,
      };
      const transaction = new Transaction(newTransaction);
      await transaction.save();
      return res.send({
        authorization_url: response.data.authorization_url,
        transaction,
      });
    });
  } catch (error) {}
};

export const getReference = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const transactionId = req.query.transId;
    const transaction = await Transaction.findOne({
      userId,
      _id: transactionId,
    });
    if (transaction?.processed === true) {
      return res.send(
        `This ${transaction?.status} transaction has already been verified`
      );
    }
    const ref: string = req.query.reference as string;
    verifyPayment(ref, async (error: any, body: any) => {
      if (error) {
        console.log(error);
        return res.send(error);
      }

      const response = JSON.parse(body);

      const data = _.at(response.data, [
        'reference',
        'amount',
        'customer.email',
        'metadata.full_name',
        'status',
      ]);

      //I can say for a fact that meeting you is a blessing!

      const [reference, amount, email, name, status] = data;

      const newDonor = { reference, amount, email, name };

      const donor = new Donor(newDonor);
      await donor.save();

      const user = await User.findOne({ email: donor.email });

      if (status === 'success') {
        await User.updateOne(
          { _id: user?._id },
          { $inc: { walletBalance: donor.amount / 100 } }
        );

        const updatedTransaction = await Transaction.findByIdAndUpdate(
          { _id: transactionId },
          { processed: true, status: 'accepted' },
          { new: true }
        );

        return res.send({
          message: 'Transaction accepted',
          donor,
          transaction: updatedTransaction,
        });
      } else {
        const updatedTransaction = await Transaction.findByIdAndUpdate(
          { _id: transactionId },
          { processed: true, status: 'declined' },
          { new: true }
        );

        return res.send({
          message: 'Transaction declined',
          donor,
          transaction: updatedTransaction,
        });
      }
    });
  } catch (error) {
    return res.send("Something isn't right");
  }
};

export const getTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const transaction = await Transaction.find({
      userId: req.params.userId,
    });
    res.send(transaction);
  } catch (error) {
    res.send({
      status: 'An error occured',
      message: 'Data not found',
    });
  }
};