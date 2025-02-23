import { StatusCodes } from 'http-status-codes'
import User from '../models/userModel.js'
import { generateToken } from '../utils/generateToken.js'


// @desc    Register a new user
// @route   POST /api/users
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
        })

        if (user) {
            res.status(StatusCodes.CREATED).json({
                message: 'User created',
                user: {
                    _id: user._id,
                    name: user.name,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    defaultAddress: user.defaultAddress,
                    contactNumber: user.contactNumber,
                    pic: user.pic,
                    birthday: user.birthday,
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
                    name: updatedUser.name,
                    firstname: updatedUser.firstname,
                    lastname: updatedUser.lastname,
                    email: updatedUser.email,
                    defaultAddress: updatedUser.defaultAddress,
                    contactNumber: updatedUser.contactNumber,
                    pic: updatedUser.pic,
                    birthday: updatedUser.birthday,
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
// @route   POST /api/users/auth
// @access  Public
export const authUser = async (req, res, next) => {
    const { email, password } = req.body
    try {
        if (!email || !password) {
            res.status(400)
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
            res.status(401).json({ message: 'Invalid Password or Email' })
        }
    } catch (error) {
        return next(error)
    }
}

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = (_req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    })
    res.status(StatusCodes.NO_CONTENT).json({ message: 'Logged out successfully' })
}

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
    if (req.user.membershipType !== 'admin') {
        return res.status(403).json('Unauthorized')
    }

    try {
        const user = await User.findById(req.params.id).select('-password')

        if (user) {
            res.json(user)
        } else {
            return res.status(404).json('User not found')
        }
    } catch (error) {
        next(error)
    }
}

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
        res.json(user)
    } else {
        res.status(404)
        throw new Error('User not found')
    }
}

// Function to validate the current password
export const validatePassword = async (req, res) => {
    const { currentPassword } = req.body

    try {
        const user = await User.findById(req.user._id) // Ensure req.user is populated with the logged-in user's information

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        console.log(currentPassword)
        // Check if the provided password matches the stored hashed password
        const isMatch = await user.matchPassword(currentPassword) // Define this method in your user model
        console.log(isMatch)

        if (!isMatch) {
            return res.status(400).json({ valid: false })
        }

        return res.json({ valid: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Update function for changing password
export const updatePassword = async (req, res) => {
    const { newPassword } = req.body

    try {
        const user = await User.findById(req.user._id) // Get the user

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Hash the new password before saving
        user.password = newPassword

        // Save updated user
        const updatedUser = await user.save()

        if (updatedUser) {
            res.status(200).json({
                message: 'Password updated successfully',
                user: {
                    _id: updatedUser._id,
                    email: updatedUser.email,
                },
            })
        } else {
            res.status(500)
            throw new Error('User update failed')
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Server error' })
    }
}

export const deleteUserAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            res.status(404)
            throw new Error('User not found')
        }

        await User.findByIdAndDelete(req.user._id)

        res.status(200).json({ message: 'User account deleted successfully' })
    } catch (error) {
        return next(error)
    }
}

