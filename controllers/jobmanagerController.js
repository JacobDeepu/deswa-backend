import mongoose from "mongoose";
import JobManager from "../models/jobmanagerModel.js";
import { response } from "express";

export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  //validate fields
  if (!name) {
    next("JobManager Name is required!");
    return;
  }
  if (!email) {
    next("Email address is required!");
    return;
  }
  if (!password) {
    next("Password is required and must be greater than 6 characters");
    return;
  }

  try {
    const accountExist = await JobManager.findOne({ email });

    if (accountExist) {
      next("Email Already Registered. Please Login");
      return;
    }

    // create a new account
    const jobmanager = await JobManager.create({
      name,
      email,
      password,
    });

    // user token
    const token = jobmanager.createJWT();

    res.status(201).json({
      success: true,
      message: "JobManager Account Created Successfully",
      user: {
        _id: jobmanager._id,
        name: jobmanager.name,
        email: jobmanager.email,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    //validation
    if (!email || !password) {
      next("Please Provide AUser Credentials");
      return;
    }

    const jobmanager = await JobManager.findOne({ email }).select("+password");

    if (!jobmanager) {
      next("Invalid email or Password");
      return;
    }

    //compare password
    const isMatch = await jobmanager.comparePassword(password);
    if (!isMatch) {
      next("Invalid email or Password");
      return;
    }
    jobmanager.password = undefined;

    const token = jobmanager.createJWT();

    res.status(200).json({
      success: true,
      message: "Login SUccessfully",
      user: jobmanager,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const updateJobManagerProfile = async (req, res, next) => {
  const { name, contact, location, profileUrl, about } = req.body;

  try {
    // validation
    if (!name || !location || !about || !contact || !profileUrl) {
      next("Please Provide All Required Fields");
      return;
    }

    const id = req.body.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No JobManager with id: ${id}`);

    const updateJobManager = {
      name,
      contact,
      location,
      profileUrl,
      about,
      _id: id,
    };

    const jobmanager = await JobManager.findByIdAndUpdate(id, updateJobManager, {
      new: true,
    });

    const token = jobmanager.createJWT();

    jobmanager.password = undefined;

    res.status(200).json({
      success: true,
      message: "JobManager Profile Updated SUccessfully",
      jobmanager,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getJobManagerProfile = async (req, res, next) => {
  try {
    const id = req.body.user.userId;

    const jobmanager = await JobManager.findById({ _id: id });

    if (!jobmanager) {
      return res.status(200).send({
        message: "JobManager Not Found",
        success: false,
      });
    }

    jobmanager.password = undefined;
    res.status(200).json({
      success: true,
      data: jobmanager,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

//GET ALL COMPANIES
export const getJobManager = async (req, res, next) => {
  try {
    const { search, sort, location } = req.query;

    //conditons for searching filters
    const queryObject = {};

    if (search) {
      queryObject.name = { $regex: search, $options: "i" };
    }

    if (location) {
      queryObject.location = { $regex: location, $options: "i" };
    }

    let queryResult = JobManager.find(queryObject).select("-password");

    // SORTING
    if (sort === "Newest") {
      queryResult = queryResult.sort("-createdAt");
    }
    if (sort === "Oldest") {
      queryResult = queryResult.sort("createdAt");
    }
    if (sort === "A-Z") {
      queryResult = queryResult.sort("name");
    }
    if (sort === "Z-A") {
      queryResult = queryResult.sort("-name");
    }

    // PADINATIONS
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // records count
    const total = await JobManager.countDocuments(queryResult);
    const numOfPage = Math.ceil(total / limit);
    // move next page
    // queryResult = queryResult.skip(skip).limit(limit);

    // show mopre instead of moving to next page
    queryResult = queryResult.limit(limit * page);

    const jobmanager = await queryResult;

    res.status(200).json({
      success: true,
      total,
      data: jobmanager,
      page,
      numOfPage,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

//GET  COMPANY JOBS
export const getJobManagerJobListing = async (req, res, next) => {
  const { search, sort } = req.query;
  const id = req.body.user.userId;

  try {
    //conditons for searching filters
    const queryObject = {};

    if (search) {
      queryObject.location = { $regex: search, $options: "i" };
    }

    let sorting;
    //sorting || another way
    if (sort === "Newest") {
      sorting = "-createdAt";
    }
    if (sort === "Oldest") {
      sorting = "createdAt";
    }
    if (sort === "A-Z") {
      sorting = "name";
    }
    if (sort === "Z-A") {
      sorting = "-name";
    }

    let queryResult = await JobManager.findById({ _id: id }).populate({
      path: "jobPosts",
      options: { sort: sorting },
    });
    const jobmanager = await queryResult;

    res.status(200).json({
      success: true,
      jobmanager,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

// GET SINGLE COMPANY
export const getJobManagerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const jobmanager = await JobManager.findById({ _id: id }).populate({
      path: "jobPosts",
      options: {
        sort: "-_id",
      },
    });

    if (!jobmanager) {
      return res.status(200).send({
        message: "JobManager Not Found",
        success: false,
      });
    }

    jobmanager.password = undefined;

    res.status(200).json({
      success: true,
      data: jobmanager,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
