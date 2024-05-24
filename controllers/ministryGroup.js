import express from "express";
import MinistryGroup from "../models/ministryGroup.js";
import Preacher from "../models/preacher.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import ejs from 'ejs';
import pdf from 'html-pdf';
import path from 'path';
import { __dirname } from "../app.js";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const generateListOfMinistryGroups = (req, res, next) => {
    MinistryGroup
        .find({congregation: req.user._id})
        .populate(["preachers", "overseer"])
        .sort({name: 1})
        .exec()
        .then((ministryGroups) => {
            let data = {
                currentUser: req.user.toJSON(), 
                ministryGroups
            };
            ejs.renderFile(path.join(__dirname, './views/ministryGroups/generate-pdf.ejs'), data, {}, function(err, str) {
                if (err) return res.send({...err, line: 28});

                const title = data.currentUser.username.split(" ").join("-");
                const DOWNLOAD_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'downloads/')


                var options = { format: 'A4', orientation: 'landscape', timeout: 540000 };

                pdf.create(str, options).toFile(`${DOWNLOAD_DIR}Grupy_sluzby_${title}.pdf`, function(err, data) {
                    if (err) return console.log(err);
                  
                    
                
                   res.download(data.filename, `Grupy_sluzby_${title}.pdf`, (err) => {
                        if (err) {
                            res.send({
                                error : err,
                                msg   : "Problem downloading the file"
                            })
                        } else {
                            res.send("Plik pomyślnie utworzony. Zobacz folder Pobrane")
                    
                        }
                    })
                });
            
            });
            
        })
        .catch((err) => console.log(err))
}

export const getListOfMinistryGroups = (req, res, next) => {
    const congregationID = req.user.username ? String(req.user._id) : req.user.congregation;
    MinistryGroup
        .find({ congregation: congregationID })
        .populate(["preachers", "overseer"])
        .exec()
        .then((ministryGroups) => {
            res.json(ministryGroups)
        })
        .catch((err) => console.log(err))
}

export const createMinistryGroup = (req, res, next) => {
    MinistryGroup
        .create({name: req.body.name})
        .then((createdMinistryGroup) => {
            createdMinistryGroup.congregation = req.user._id;
            createdMinistryGroup.preachers = typeof req.body.preachers === 'string' ? [req.body.preachers] : [...req.body.preachers];
            createdMinistryGroup.overseer = req.body.overseer;
            createdMinistryGroup.save();
            res.json(createdMinistryGroup);
        })
        .catch((err) => console.log(err))
}



export const editMinistryGroup = (req, res, next) => {
    MinistryGroup
        .findById(req.params.ministryGroup_id)
        .exec()
        .then((ministryGroup) => {
            ministryGroup.name = req.body.ministryGroup.name;
            ministryGroup.preachers = typeof req.body.ministryGroup.preachers === 'string' ? [req.body.ministryGroup.preachers] : [...req.body.ministryGroup.preachers];
            ministryGroup.overseer = req.body.ministryGroup.overseer;
            ministryGroup.save();
            res.json(ministryGroup);
        })
        .catch((err) => console.log(err))
}

export const deleteMinistryGroup = (req, res, next) => {
    MinistryGroup
        .findByIdAndDelete(req.params.ministryGroup_id)
        .exec()
        .then((ministryGroup) => {
            res.json(ministryGroup)
        })
        .catch((err) => console.log(err))
}

