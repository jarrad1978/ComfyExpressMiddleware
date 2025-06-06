const { getJobManager } = require('../services/jobManager');
const { getJobProcessor } = require('../services/jobProcessor');

/**
 * Remove base64 data from job object to prevent huge responses
 * @param {Object} job - Job object
 * @returns {Object} Sanitized job object without base64 data
 */
function sanitizeJobForListing(job) {
  const sanitized = { ...job };
  
  // Remove base64 from input data
  if (sanitized.data && sanitized.data.imageBase64) {
    sanitized.data = { ...sanitized.data };
    delete sanitized.data.imageBase64;
    sanitized.data.imageBase64_size = '[removed - use result endpoint]';
  }
  
  // Remove base64 from result data
  if (sanitized.result && sanitized.result.base64) {
    sanitized.result = { ...sanitized.result };
    delete sanitized.result.base64;
    sanitized.result.base64_size = '[removed - use result endpoint]';
  }
  
  return sanitized;
}

/**
 * Get job status by ID (admin info endpoint - excludes base64 data)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getJobStatus(req, res) {
  const { jobId } = req.params;
  
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }
  
  try {
    const jobManager = getJobManager();
    const job = jobManager.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Sanitize job data to exclude base64 content
    const sanitizedJob = sanitizeJobForListing(job);
    
    return res.status(200).json(sanitizedJob);
  } catch (error) {
    console.error('Error getting job status:', error);
    return res.status(500).json({
      error: 'Failed to get job status',
      details: error.message
    });
  }
}

/**
 * Get all jobs with optional filtering (excludes base64 data)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllJobs(req, res) {
  const { status, type, instance } = req.query;
  
  try {
    const jobManager = getJobManager();
    let jobs;
    
    if (instance) {
      jobs = jobManager.getJobsByInstance(instance);
    } else if (status) {
      jobs = jobManager.getJobsByStatus(status);
    } else {
      jobs = jobManager.getAllJobs(status, type);
    }
    
    // Sanitize all jobs to exclude base64 content
    const sanitizedJobs = jobs.map(job => sanitizeJobForListing(job));
    
    return res.status(200).json({
      jobs: sanitizedJobs,
      total: sanitizedJobs.length
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    return res.status(500).json({
      error: 'Failed to get jobs',
      details: error.message
    });
  }
}

/**
 * Get job manager statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getJobStats(req, res) {
  try {
    const jobManager = getJobManager();
    const stats = jobManager.getStats();
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting job stats:', error);
    return res.status(500).json({
      error: 'Failed to get job statistics',
      details: error.message
    });
  }
}

/**
 * Delete a job manually
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteJob(req, res) {
  const { jobId } = req.params;
  
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }
  
  try {
    const jobManager = getJobManager();
    const success = jobManager.deleteJob(jobId);
    
    if (!success) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    return res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return res.status(500).json({
      error: 'Failed to delete job',
      details: error.message
    });
  }
}

/**
 * Clean up expired jobs manually
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function cleanupExpiredJobs(req, res) {
  try {
    const jobManager = getJobManager();
    const cleanedCount = jobManager.cleanupExpiredJobs();
    
    return res.status(200).json({ 
      message: `Cleaned up ${cleanedCount} expired jobs`,
      cleanedCount: cleanedCount
    });
  } catch (error) {
    console.error('Error cleaning up jobs:', error);
    return res.status(500).json({
      error: 'Failed to cleanup expired jobs',
      details: error.message
    });
  }
}

/**
 * Get job processor statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getProcessorStats(req, res) {
  try {
    const jobProcessor = getJobProcessor();
    const processorStats = jobProcessor.getStats();
    
    return res.status(200).json(processorStats);
  } catch (error) {
    console.error('Error getting processor stats:', error);
    return res.status(500).json({
      error: 'Failed to get processor statistics',
      details: error.message
    });
  }
}

module.exports = {
  getJobStatus,
  getAllJobs,
  getJobStats,
  deleteJob,
  cleanupExpiredJobs,
  getProcessorStats
};