import express from "express";
import Preacher from "../models/preacher.js";
import Territory from "../models/territory.js";
import Checkout from "../models/checkout.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import dotenv from 'dotenv';
import node_geocoder from "node-geocoder";
// import mbxClient from '@mapbox/mapbox-sdk';
// import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding.js';
import { countDaysFromNow, dateToISOString, escapeRegex, createCheckout } from "../helpers.js";

dotenv.config();

const app = express();
// const mbxMainClient = mbxClient({ accessToken: process.env.MAPBOX_TOKEN });
// const geocoder = mbxGeocoding(mbxMainClient);

// console.log(mbxMainClient);
// console.log(geocoder.forwardGeocode())

let options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
  };
let geocoder = node_geocoder(options);


app.use(flash());
app.use(methodOverride("_method"));

export const getListOfAllTerritories = (req, res, next) => {
    const paginationOptions = {
        limit: req.query.limit || 20,
        page: req.query.page || 1,
        populate: 'preacher',
        sort: {number: 1}
    }
    Territory
        .paginate({congregation: req.user._id}, paginationOptions)
        .then((result) => {
            Preacher
                .find({congregation: req.user._id})
                .sort({name: 1})
                .exec()
                .then((preachers) => {
                    res.json(result);
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
}

export const getListOfAvailableTerritories = (req, res, next) => {
    const paginationOptions = {
        limit: req.query.limit || 15,
        page: req.query.page || 1,
        populate: 'preacher',
        sort: {lastWorked: 1}
    }
    Territory
        .find({ $and: [{congregation: req.user._id}, {type: 'free'}]})
        .exec()
        .then((territories) => {
            Territory
                .paginate({ $and: [{congregation: req.user._id}, {type: 'free'}]}, paginationOptions)
                .then((result) => {
                    res.json(result);
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
}


export const searchAllTerritories = (req, res, next) => {
    const paginationOptions = {
        limit: req.query.limit || 20,
        page: req.query.page || 1,
        populate: 'preacher',
        sort: {number: 1}
    }
    if(typeof req.query.city !== 'undefined'){
        const regex = new RegExp(escapeRegex(req.query.city), 'gi');
        Territory
            .paginate({
                $and: [
                    {city: regex}, 
                    {congregation: req.user._id}
                ]
            }, paginationOptions)
            .then((result) => {
                Preacher
                    .find({congregation: req.user._id})
                    .sort({name: 1})
                    .exec()
                    .then((preachers) => {
                        res.json(result);
                    })
                    .catch((err) => console.log(err))
            })
            .catch((err) => console.log(err))
    } else if(typeof req.query.street !== 'undefined'){
        const regex = new RegExp(escapeRegex(req.query.street), 'gi');
        Territory
            .paginate({
                $and: [
                    {street: regex}, 
                    {congregation: req.user._id}
                ]
            }, paginationOptions)
            .then((result) => {
                Preacher
                    .find({congregation: req.user._id})
                    .sort({name: 1})
                    .exec()
                    .then((preachers) => {
                        res.json(result);
                    })
                    .catch((err) => console.log(err))
            })
            .catch((err) => console.log(err))
            
    } else if(typeof req.query.number !== 'undefined'){
        
        Territory
            .paginate({
                $and: [
                    {number: req.query.number}, 
                    {congregation: req.user._id}
                ]
            }, paginationOptions)
            .then((result) => {
                Preacher
                    .find({congregation: req.user._id})
                    .sort({name: 1})
                    .exec()
                    .then((preachers) => {
                        res.json(result);
                    })
                    .catch((err) => console.log(err))
            })
            .catch((err) => console.log(err))
    } else if(typeof req.query.preacher !== 'undefined'){
        Preacher
            .findOne({ 
                $and: [
                    { congregation: req.user._id }, 
                    {_id: req.query.preacher}
                ] 
            })
            .exec()
            .then((preacher) => {
                Territory
                    .paginate({
                        $and: [
                            {preacher: preacher._id}, 
                            {congregation: req.user._id}
                        ]
                    }, paginationOptions)
                    .then((result) => {
                        Preacher
                            .find({congregation: req.user._id})
                            .sort({name: 1})
                            .exec()
                            .then((preachers) => {
                                res.json(result);
                            })
                            .catch((err) => console.log(err))
                    })
                    .catch((err) => console.log(err))
            })
            .catch((err) => console.log.err)
    } else if(typeof req.query.kind !== 'undefined'){
        
        Territory
            .paginate({
                $and: [
                    {kind: req.query.kind}, 
                    {congregation: req.user._id}
                ]
            }, paginationOptions)
            .then((result) => {
                Preacher
                    .find({congregation: req.user._id})
                    .sort({name: 1})
                    .exec()
                    .then((preachers) => {
                        res.json(result)
                    })
                    .catch((err) => console.log(err))
            })
            .catch((err) => console.log(err))
    } else if(typeof req.query.taken !== 'undefined') {
        Territory
        .paginate({
            $and: [
                {type: { $not: /free/ }}, 
                {congregation: req.user._id}
            ]
        }, paginationOptions)
        .then((result) => {
            Preacher
                .find({congregation: req.user._id})
                .sort({name: 1})
                .exec()
                .then((preachers) => {
                    res.json(result);
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
    }
}

export const createTerritory = (req, res, next) => {
    const taken = new Date(req.body.taken).toISOString().slice(0, 10);
    const lastWorked = new Date(req.body.lastWorked).toISOString().slice(0, 10);
    let newTerritory = new Territory({
        city: req.body.city, 
        street: req.body.street, 
        beginNumber: req.body.beginNumber,
        endNumber: req.body.endNumber,
        taken,
        lastWorked,
        description: req.body.description,
        number: req.body.number,
        kind: req.body.kind,
        congregation: req.user._id,
    });
    Territory
        .create(newTerritory)
        .then((createdTerritory) => {
            geocoder.geocode(req.body.location, function (err, data) {
                if (err || !data.length) {
                    req.flash('error', err.message);
                    return res.redirect(`/territories/new`);
                }
            
                if(req.body.preacher === ""){
                    createdTerritory.type="free";
                } else {
                    createdTerritory.preacher = req.body.preacher;
                }
                createdTerritory.latitude = data[0].latitude;
                createdTerritory.longitude = data[0].longitude;
                createdTerritory.location = data[0].formattedAddress;
                createdTerritory.isPhysicalCard = req.body.isPhysicalCard === 'true';
                createdTerritory.save();
                console.log(createdTerritory)
                res.json(createdTerritory);
            })
            // geocoder
            //     .forwardGeocode({
            //         query: 'Paris, France',
            //         limit: 2
            //     })
            //     .send()
            //     .then((response) => {
            //         console.log(response.body)
            //     })
            //     .catch(err => console.log(err))  
        })
        .catch((err) => console.log(err))
}

export const getTerritoryHistory = (req, res, next) => {
    Territory
        .findById(req.params.territory_id)
        .populate(["preacher", "history", {
            path: "history",
            populate: {
                path: "preacher",
                model: "Preacher"
            }
        }])
        .exec()
        .then((territory) => {
            Territory
                .find({congregation: req.user._id})
                .exec()
                .then((territories) => {
                    const currentIndex = territories.findIndex(t => t._id.toString() === territory._id.toString());
                    res.json({territories, territory, currentIndex})
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
}


export const editTerritory = (req, res, next) => {
    Territory
        .findById(req.params.territory_id)
        .populate("preacher")
        .exec()
        .then((territory) => {
            let record = territory;
            geocoder.geocode(req.body.territory.location, async function (err, data) {
                if (err || !data.length) {
                    req.flash('error', err.message);
                    return res.redirect(`/territories/${req.user._id}/edit`);
                }
                const taken = new Date(req.body.territory.taken).toISOString().slice(0, 10);
                const lastWorked = new Date(req.body.territory.lastWorked).toISOString().slice(0, 10);

             
                let checkout = territory.preacher?.toString().length !== 0 && req.body.territory.preacher === "" && await createCheckout(territory, req.body);
            
        
                if(checkout){
                    territory.history.push(checkout);
                }
                    
                    territory.latitude = data[0].latitude;
                    territory.longitude = data[0].longitude;
                    territory.location = data[0].formattedAddress;
                    territory.city = req.body.territory.city;
                    territory.street = req.body.territory.street;
                    territory.number = req.body.territory.number;
                    territory.description = req.body.territory.description;
                    territory.taken = taken;
                    territory.beginNumber = req.body.territory.beginNumber;
                    territory.endNumber = req.body.territory.endNumber;
                    territory.lastWorked = lastWorked;
                    territory.kind = req.body.territory.kind;
                    
                    territory.isPhysicalCard = req.body.territory.isPhysicalCard === 'true';
                    if(req.body.territory.preacher === ""){
                        territory.preacher = undefined;
                        territory.type = "free";
                    } else {
                        territory.preacher = req.body.territory.preacher;
                        territory.type = undefined;
                    }
                    territory.save();
                    res.json(territory);
                
            });
            
        })
        .catch((err) => console.log(err))
}

export const deleteTerritory = (req, res, next) => {
    Territory
        .findByIdAndDelete(req.params.territory_id)
        .exec()
        .then((territory) =>  res.json(territory))
        .catch((err) => console.log(err))
}


export const searchAvailableTerritories = (req, res, next) => {
    const paginationOptions = {
        limit: req.query.limit || 20,
        page: req.query.page || 1,
        populate: 'preacher',
        sort: {lastWorked: 1}
    }
    if(typeof req.query.city !== 'undefined'){
        const regex = new RegExp(escapeRegex(req.query.city), 'gi');
        Territory
            .paginate({
                $and: [
                    {city: regex}, 
                    {congregation: req.user._id}, 
                    {type: 'free'}
                ]
            }, paginationOptions)
            .then((territories) => {
                res.json(territories);
            })
            .catch((err) => console.log(err))
    } else if(typeof req.query.street !== 'undefined'){
        const regex = new RegExp(escapeRegex(req.query.street), 'gi');
        Territory
            .paginate({
                $and: [
                    {street: regex}, 
                    {congregation: req.user._id}, 
                    {type: 'free'}
                ]
            }, paginationOptions)
            .then((territories) => {
                res.json(territories);
            })
            .catch((err) => console.log(err))
    } else if(typeof req.query.number !== 'undefined'){
        
        Territory
            .paginate({
                $and: [
                    {number: req.query.number}, 
                    {congregation: req.user._id}, 
                    {type: 'free'}
                ]
            }, paginationOptions)
            .then((territories) => {
                res.json(territories);
            })
            .catch((err) => console.log(err))
    } else if(req.query.kind !== 'undefined'){
        Territory
            .paginate({
                $and: [
                    {kind: req.query.kind}, 
                    {congregation: req.user._id}, 
                    {type: 'free'}
                ]
            }, paginationOptions)
            .then((territories) => {
                res.json(territories);
            })
            .catch((err) => console.log(err))
    }
}

export const searchChangesByDate = (req, res, next) => {
    Territory
        .find({
            $and: [{
                $or: [{ lastWorked: req.query.date }, { taken: req.query.date }]
            }]
        })
        .populate("preacher")
        .exec()
        .then((territories) => {
            Preacher
            .find({congregation: req.user._id})
            .sort({name: 1})
            .exec()
            .then((preachers) => {
                res.json(territories)
            })
            .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
}