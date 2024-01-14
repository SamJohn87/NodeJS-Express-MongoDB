const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');

const campsiteRouter = express.Router();

campsiteRouter.route('/')
    .get((req, res, next) => { //get list of campsites - open to all
        Campsite.find()
            .populate('comments.author')
            .then(campsites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsites);
            })
            .catch(err => next(err));
    })
    .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { //add campsite - admin user only
        Campsite.create(req.body)
            .then(campsite => {
                console.log('Campsite Created: ', campsite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
    })
    .put((req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /campsites');
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { //delete all campsites - admon user only
        Campsite.deleteMany()
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);

            })
            .catch(err => next(err));
    });

campsiteRouter.route('/:campsiteId') //get specific campsite info - open to all
    .get((req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
    })
    .post((req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
    })
    .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { //update campsite - admin user only
        Campsite.findByIdAndUpdate(req.params.campsiteId, { $set: req.body }, { new: true })
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { //delete campsite - admin user only
        Campsite.findByIdAndDelete(req.params.campsiteId)
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

campsiteRouter.route('/:campsiteId/comments') // ALL COMMENTS
    .get((req, res, next) => { //get all the comments - open to all
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then(campsite => {
                if (campsite) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite.comments);
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(authenticate.verifyUser, (req, res, next) => { //add a comment - authenticated user
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite) {
                    req.body.author = req.user._id; //insert user id into request body before pushing it in comments array
                    campsite.comments.push(req.body);
                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(campsite)
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put((req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { //delete all comments - admin user only 
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite) {
                    for (let i = (campsite.comments.length - 1); i >= 0; i--) {
                        campsite.comments.id(campsite.comments[i]._id).remove();
                    }
                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(campsite)
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

campsiteRouter.route('/:campsiteId/comments/:commentId')
    .get((req, res, next) => { //get specific comment - open to all
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then(campsite => {
                if (campsite && campsite.comments.id(req.params.commentId)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite.comments.id(req.params.commentId));
                } else if (!campsite) {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post((req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
    })
    .put(authenticate.verifyUser, (req, res, next) => { //update comment - user needs to be authenticated
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite //update possible only if user is authenticated and is comment's author
                    && campsite.comments.id(req.params.commentId)
                    && campsite.comments.id(req.params.commentId).author.toString() === req.user._id.toString()) {
                    if (req.body.rating) {
                        campsite.comments.id(req.params.commentId).rating = req.body.rating;
                    }

                    if (req.body.text) {
                        campsite.comments.id(req.params.commentId).text = req.body.text;
                    }

                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(campsite)
                        })
                        .catch(err => next(err));
                } else if (campsite.comments.id(req.params.commentId).author.toString() !== req.user._id.toString()) {
                    err = new Error('You are not authorized to perform this operation!');
                    err.status = 403;
                    return next(err);
                } else if (!campsite) {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .delete(authenticate.verifyUser, (req, res, next) => { //delete a comment
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite
                    && campsite.comments.id(req.params.commentId)
                    && campsite.comments.id(req.params.commentId).author.toString() === req.user._id.toString()
                ) { //delete comment possible if user is authenticated and comment's author
                    campsite.comments.id(req.params.commentId).remove();
                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(campsite);
                        })
                        .catch(err => next(err));
                } else if (campsite.comments.id(req.params.commentId).author.toString() !== req.user._id.toString()) {
                    err = new Error('You are not authorized to perform this operation!');
                    err.status = 403;
                    return next(err);
                } else if (!campsite) {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

module.exports = campsiteRouter;