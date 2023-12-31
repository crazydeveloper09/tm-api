import express from "express";
import { isLoggedIn } from "../helpers.js";
import {
    createTerritory,
    deleteTerritory,
    editTerritory,
    getListOfAllTerritories,
    getListOfAvailableTerritories,
    getTerritoryHistory,
    searchAllTerritories,
    searchAvailableTerritories,
    searchChangesByDate,
} from "../controllers/territory.js";

const router = express.Router({ mergeParams: true });

router.get("/", isLoggedIn, getListOfAllTerritories);
router.get("/available", isLoggedIn, getListOfAvailableTerritories);
router.get("/all/search", isLoggedIn, searchAllTerritories);
router.get("/dateChanges", isLoggedIn, searchChangesByDate);
router.get("/:territory_id", isLoggedIn, getTerritoryHistory);
router.get("/available/search", isLoggedIn, searchAvailableTerritories);

router.post("/", isLoggedIn, createTerritory);

router.put("/:territory_id", isLoggedIn, editTerritory);

router.delete("/:territory_id", isLoggedIn, deleteTerritory)

export default router;
