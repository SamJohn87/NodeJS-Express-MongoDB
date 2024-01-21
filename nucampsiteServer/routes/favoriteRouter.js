const express = require('express');
const Favorite = require('../models/favorite');
const Campsite = require('../models/campsite')
const authenticate = require('../authenticate');
const mongoose = require('mongoose');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200)
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => { //get document listing the user's favorites campsites - user needs to be authenticated
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { //add favorite - user need to be authenticated
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) { //favorite document exist for user
                    req.body.forEach((campsite) => {
                        if (!favorite.campsites.includes(campsite._id)) { //not already added
                            favorite.campsites.push(campsite._id);
                        }
                    });
                    favorite.save()
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite)
                        })
                        .catch(err => next(err));
                } else { //create document
                    Favorite.create({ user: req.user._id, campsites: req.body })
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { //delete users' favorites
        Favorite.findOneAndDelete({ user: req.user._id })
            .then(response => {
                res.statusCode = 200;
                if (response) {
                    res.setHeader('Content-Type', 'application/json');
                    res.json(response);
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You do not have any favorites to delete.');
                }
            })
            .catch(err => next(err));
    });

favoriteRouter.route('/:campsiteId') // - User needs to be authenticated
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200)
    })
    .get(cors.cors, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        //BONUS CHALLENGE - check if it is a valid campsiteId
        Campsite.findOne({ _id: req.params.campsiteId })
            .then((campsite => {
                //if (campsite) { //valid campsiteId
                Favorite.findOne({ user: req.user._id })
                    .then(favorite => {
                        if (favorite) { //favorite document found
                            if (!favorite.campsites.includes(req.params.campsiteId)) { //not already added
                                favorite.campsites.push(req.params.campsiteId);
                                favorite.save()
                                    .then(favorite => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(favorite)
                                    })
                                    .catch(err => next(err));
                            } else {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'text/plain');
                                res.end('That campsite is already in the list of favorites!');
                            }
                        } else { //no favorite document found
                            Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] })
                                .then(favorite => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                })
                                .catch(err => next(err));
                        }
                    })
                    .catch(err => next(err));
            }))
            .catch(err => { //BONUS CHALLENGE - check if it is a valid campsiteId
                if (err instanceof mongoose.CastError) {
                    // Handle the CastError (invalid ObjectId)
                    err.status = 400; // Bad Request
                    err.message = `Invalid campsiteId: ${req.params.campsiteId}`;
                }
                next(err);
            });

    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { //remove campsite as favorite
        Favorite.findOne({ user: req.user._id })
            .then((favorite => {
                if (favorite) { //favorite document for user exists
                    favorite.campsites = favorite.campsites.filter((campsite) =>
                        campsite._id.toString() !== req.params.campsiteId
                    );
                    favorite.save()
                        .then(favorite => {
                            //delete document if no favorites left
                            if (favorite.campsites.length === 0) {
                                Favorite.findOneAndDelete({ _id: req.user._id })
                                    .then(response => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'text/plain');
                                        res.end('There are no favorites to delete!');
                                    })
                                    .catch(err => next(err));
                            } else {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            }
                        })
                        .catch(err => next(err));
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('There are no favorites to delete!');
                }
            }))
            .catch(err => next(err));
    });

module.exports = favoriteRouter;

