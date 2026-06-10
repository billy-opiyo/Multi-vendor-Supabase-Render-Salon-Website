const express = require("express")

const jobController = require("./job.controller")

const router = express.Router()

router.post("/api/v1/jobs/:jobName/run", jobController.runScheduledJob)

module.exports = router