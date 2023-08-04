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
import {
  loginSchema,
  resetPasswordSchema,
  userSchema,
} from '../utils/joiValidator';
import Trip from '../model/tripModel';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("heloooo")
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

    const { ADMIN1_EMAIL, ADMIN2_EMAIL, ADMIN3_EMAIL } = process.env;
    const adminArray = [ADMIN1_EMAIL, ADMIN2_EMAIL, ADMIN3_EMAIL];

    const allUserData = {
      ...userData,
      isAdmin: adminArray.includes(req.body.email) ? true : false,
      password: hashedPassword,
    };

    const userSaved = await new User(allUserData).save();
    const token = await new Token({
      userId: userSaved._id,
      token: getToken(userSaved._id),
    }).save();

    const BASE_URL = process.env.BASE_URL || 'http://localhost:8081/api/v1';

    const url = `${BASE_URL}/users/verify/${userSaved._id}/${token.token}`;
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
      isAdmin: userSaved.isAdmin,
    });
  } catch (error) {
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
    // res.redirect('https://main--emove-app.netlify.app/users/verify');
    return res.redirect('https://www.google.com');
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
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send({ message: 'Invalid email' });

    const isMatch = await compare(user.password, req.body.password);
    if (!isMatch) return res.status(400).send({ message: 'Invalid password' });

    if (!user.verified)
      return res.status(400).send({ message: 'User not verified' });

    const token = loginToken(user._id.toString());

    const { name, phone, walletBalance, createdAt } = user;
    res.status(200).send({
      message: 'login successful',
      name,
      phone,
      walletBalance,
      createdAt,
      loginToken: token,
      isAdmin: user.isAdmin,
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

    const BASE_URL = process.env.BASE_URL || 'http://localhost:8081/api/v1';
    const link = `${BASE_URL}/users/password-reset/${user._id}/${token.token}`;
    await sendEmail(user.email, 'Password reset', link);
    //send password reset link to email

    res.send({ message: 'password reset link sent to your email account' });
  } catch (error) {
    res.send({ message: 'An error occured' });
    console.log(error);
  }
};

export const getPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).send('invalid link or expired');

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send('Invalid link or expired');
    await token.delete();

    res.redirect(`http://localhost:3000/reset-password/${user._id}`);
  } catch (error) {
    res.send('An error occured');
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message,
      });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).send('Invalid User Id');
    user.password = await toHash(req.body.newPassword);
    await user.save();

    res
      .status(200)
      .json({ status: 'success', message: 'password reset sucessfully.' });
  } catch (error) {
    res.send({ message: 'An error occured' });
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
      return res.send({ message: 'Invalid user' });
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
        ref: response.data.reference,
      };
      const transaction = new Transaction(newTransaction);
      await transaction.save();
      return res.send({
        authorization_url: response.data.authorization_url,
        transaction,
      });
    });
  } catch (error) {
    res.status(400).send({ message: ' Error initializing payment' });
  }
};

export const getReference = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const userId = req.userId;
    // const transactionId = req.query.transId;
    const transaction = await Transaction.findOne({
      ref: req.query.reference,
    });
    if (transaction?.processed === true) {
      return res.send(
        `This ${transaction?.transactionType} transaction has already been verified`
      );
    }
    const ref: string = req.query.reference as string;
    verifyPayment(ref, async (error: any, body: any) => {
      if (error) {
        return res.send({ message: 'Verification error occured', error });
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
          { _id: transaction?._id },
          { processed: true, status: 'accepted' },
          { new: true }
        );

        res.redirect('http://localhost:3000/user/fund-wallet');
        // return res.send({
        //   message: 'Transaction accepted',
        //   donor,
        //   transaction: updatedTransaction,
        // });
      } else {
        const updatedTransaction = await Transaction.findByIdAndUpdate(
          { _id: transaction?._id },
          { processed: true, status: 'declined' },
          { new: true }
        );

        res.redirect('http://localhost:3000/user/fund-wallet');
        // return res.send({
        //   message: 'Transaction declined',
        //   donor,
        //   transaction: updatedTransaction,
        // });
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
      userId: req.userId,
    });
    res.send(transaction);
  } catch (error) {
    res.send({
      status: 'An error occured',
      message: 'Data not found',
    });
  }
};

export const tripHistoryByPassenger = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById({ _id: userId });
    if (user) {
      const { name } = user;
      const tripsByUser = await Trip.find({ passenger: name });
      if (tripsByUser) {
        res.status(200).json({ status: 'success', data: tripsByUser });
      } else {
        res
          .status(404)
          .json({ status: 'failed', message: 'No trips created by user' });
      }
    }
  } catch (err: any) {
    res
      .status(400)
      .json({ message: 'Internal server error', error: err.message });
  }
};

export const bookTrip = async (req: Request, res: Response) => {
  // Decode the JWT and extract the user ID
  try {
    const userId = req.userId;

    const routeId = req.params.routeId;

    try {
      const route = await Route.findById({ _id: routeId });
      if (route) {
        const { pickup, destination, price } = route;

        const user = await User.findById({ _id: userId });
        if (user) {
          const newTransaction = new Transaction({
            userId,
            amount: price * 100,
            transactionType: 'Debit',
          });
          // if user wallet ballance is less thab trip price return errrror
          if (user.walletBalance < price) {
            newTransaction.processed = true;
            await newTransaction.save();
            return res.status(400).json({ message: 'Insufficient fund' });
          }

          const newTrip = new Trip({
            pickup: pickup,
            destination: destination,
            price: price,
            passenger: user.name,
          });
          await newTrip.save();
          const newBallance = user.walletBalance - price;

          await User.findByIdAndUpdate(userId, { walletBalance: newBallance });

          newTransaction.status = 'accepted';
          newTransaction.processed = true;
          await newTransaction.save();

          return res
            .status(200)
            .json({ message: 'book successfull', trip: newTrip });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Route not found' });
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.userId;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send({
        message: 'User not found',
      });
    }

    res.status(200).send({ status: 'success', user });
  } catch (error) {
    res.status(400).send({ message: 'Error fetching user' });
  }
};
