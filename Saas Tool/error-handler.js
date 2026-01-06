/**
 * Error Handler Utility
 * Provides user-friendly error messages and logging
 */

class ErrorHandler {
  /**
   * Handle API errors with user-friendly messages
   */
  static handleAPIError(error, context = 'API') {
    logger.error(`${context} Error:`, error);
    
    // Network errors
    if (!navigator.onLine) {
      return {
        title: 'No Internet Connection',
        message: 'Please check your internet connection and try again.',
        action: 'Retry'
      };
    }
    
    // Parse error
    let errorMessage = 'An unexpected error occurred';
    let errorTitle = 'Error';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    // Specific error types
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      errorTitle = 'Authentication Error';
      errorMessage = 'Your session has expired. Please sign in again.';
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      errorTitle = 'Access Denied';
      errorMessage = 'You don\'t have permission to perform this action.';
    } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      errorTitle = 'Not Found';
      errorMessage = 'The requested resource was not found.';
    } else if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
      errorTitle = 'Rate Limit Exceeded';
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message?.includes('500') || error.message?.includes('Internal Server')) {
      errorTitle = 'Server Error';
      errorMessage = 'Our servers are having trouble. Please try again in a few minutes.';
    } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      errorTitle = 'Request Timeout';
      errorMessage = 'The request took too long. Please try again.';
    } else if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
      errorTitle = 'Connection Error';
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    }
    
    return {
      title: errorTitle,
      message: errorMessage,
      action: 'Dismiss'
    };
  }
  
  /**
   * Handle CRM sync errors
   */
  static handleCRMError(error, platform = 'CRM') {
    logger.error(`${platform} Sync Error:`, error);
    
    if (error.message?.includes('token') || error.message?.includes('auth')) {
      return {
        title: `${platform} Authentication Error`,
        message: `Your ${platform} connection has expired. Please reconnect.`,
        action: 'Reconnect'
      };
    }
    
    if (error.message?.includes('limit') || error.message?.includes('quota')) {
      return {
        title: `${platform} Limit Reached`,
        message: `You've reached your ${platform} API limit. Try again later.`,
        action: 'Dismiss'
      };
    }
    
    return {
      title: `${platform} Sync Failed`,
      message: error.message || 'Unable to sync contacts. Please try again.',
      action: 'Retry'
    };
  }
  
  /**
   * Show error notification to user
   */
  static showError(errorInfo) {
    // Use toast if available
    if (typeof showToast === 'function') {
      showToast(errorInfo.message, 'error');
    } else {
      // Fallback to alert
      alert(`${errorInfo.title}\n\n${errorInfo.message}`);
    }
  }
  
  /**
   * Handle contact limit errors
   */
  static handleLimitError(currentCount, maxCount, tier) {
    return {
      title: 'Contact Limit Reached',
      message: `You've reached your ${tier} plan limit of ${maxCount} contacts. Upgrade to add more!`,
      action: 'Upgrade'
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}
