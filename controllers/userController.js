import { StatusCodes } from 'http-status-codes'
import User from '../models/userModel.js'
import { generateToken } from '../utils/generateToken.js'


// @desc    Register a new user
// @route   POST /api/v1/user
// @access  Public
export const registerUser = async (req, res, next) => {
    const {
        firstname,
        lastname,
        email,
        password,
        defaultAddress,
        contactNumber,
        pic,
        memberType,
    } = req.body

    try {
        const isUserExist = await User.findOne({ email })
        if (isUserExist) {
            res.status(StatusCodes.BAD_REQUEST)
            throw new Error('User already exists')
        }

        const user = await User.create({
            firstname,
            lastname,
            email,
            password,
            defaultAddress,
            contactNumber,
            pic,
            memberType,
        })

        if (user) {
            res.status(StatusCodes.CREATED).json({
                message: 'User created',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                },
            })
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            throw new Error('User update failed')
        }

    } catch (error) {
        return next(error)
    }
}

// @desc    update user
// @route   PUT /api/v1/user
// @access  Private
export const updateUser = async (req, res, next) => {
    const {
        firstname,
        lastname,
        email,
        password,
        defaultAddress,
        contactNumber,
        pic,
        birthday,
    } = req.body

    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            res.status(StatusCodes.NOT_FOUND)
            throw new Error('User not found')
        }

        // Update user details
        user.firstname = firstname || user.firstname
        user.lastname = lastname || user.lastname
        user.email = email || user.email
        if (password) user.password = password // Only update if password is provided
        user.defaultAddress = defaultAddress || user.defaultAddress
        user.contactNumber = contactNumber || user.contactNumber
        user.pic = pic || user.pic
        user.birthday = birthday || user.birthday

        // Save updated user
        const updatedUser = await user.save()

        if (updatedUser) {
            res.status(StatusCodes.OK).json({
                message: 'User updated successfully',
                user: {
                    _id: updatedUser._id,
                },
            })
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            throw new Error('User update failed')
        }
    } catch (error) {
        return next(error)
    }
}

// @desc    Auth user & get token
// @route   POST /api/v1/user/auth
// @access  Public
export const authUser = async (req, res, next) => {
    const { email, password } = req.body
    try {
        if (!email || !password) {
            res.status(StatusCodes.BAD_REQUEST)
            throw new Error('Email and password are required')
        }
        const user = await User.findOne({ email })

        // if (user.isVerified === false) {
        //     return res.status(401).json({ message: 'User Email Not Verified' })
        // }

        if (user && (await user.matchPassword(password))) {
            generateToken(res, user._id)

            res.json({
                _id: user._id,
            })
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid Password or Email' })
        }
    } catch (error) {
        return next(error)
    }
}

// @desc    Logout user / clear cookie
// @route   POST /api/v1/user/logout
// @access  Public
export const logoutUser = (_req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    })
    res.status(StatusCodes.NO_CONTENT).json({ message: 'Logged out successfully' })
}

// @desc    Get user profile
// @route   GET /api/v1/user/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password')

    if (user) {
        res.json(user)
    } else {
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('User not found')
    }
}

// Function to validate the current password
export const validatePassword = async (req, res) => {
    const { currentPassword } = req.body

    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' })
        }

        console.log(currentPassword)
        const isMatch = await user.matchPassword(currentPassword) // Define this method in your user model
        console.log(isMatch)

        if (!isMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({ valid: false })
        }

        return res.json({ valid: true })
    } catch (error) {
        console.error(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' })
    }
}


// Update function for changing password
export const updatePassword = async (req, res) => {
    const { newPassword } = req.body

    try {
        const user = await User.findById(req.user._id) // Get the user

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' })
        }

        // Hash the new password before saving
        user.password = newPassword

        // Save updated user
        const updatedUser = await user.save()

        if (updatedUser) {
            res.status(StatusCodes.OK).json({
                message: 'Password updated successfully',
                user: {
                    _id: updatedUser._id,
                    email: updatedUser.email,
                },
            })
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            throw new Error('User update failed')
        }
    } catch (error) {
        console.error(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' })
    }
}

export const deleteUserAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            res.status(StatusCodes.NOT_FOUND)
            throw new Error('User not found')
        }

        await User.findByIdAndDelete(req.user._id)

        res.status(StatusCodes.OK).json({ message: 'User account deleted successfully' })
    } catch (error) {
        return next(error)
    }
}

// @desc    Get user by ID
// @route   GET /api/v1/user/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
    if (req.user.memberType !== 'admin') {
        return res.status(StatusCodes.UNAUTHORIZED).json('Unauthorized')
    }

    try {
        const user = await User.findById(req.params.id).select('-password')

        if (user) {
            res.json(user)
        } else {
            return res.status(StatusCodes.NOT_FOUND).json('User not found')
        }
    } catch (error) {
        next(error)
    }
}

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
    if (req.user.memberType !== "admin") {
        return res.status(StatusCodes.UNAUTHORIZED).json("Unauthorized");
    }

    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        if (users.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json("No users found");
        }

        res.json(users);
    } catch (error) {
        next(error);
    }
};
