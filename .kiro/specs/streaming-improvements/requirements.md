# Requirements Document

## Introduction

The HTML Prototype Builder currently experiences failures when generating large, complex prototypes (like CRM dashboards) due to LLM timeout issues and incomplete response handling. While streaming is already implemented, it needs improvements in timeout handling, error recovery, and response completion detection to reliably handle large code generation requests.

The key issues are:
1. **LLM timeouts** - Large responses take too long and timeout
2. **Incomplete responses** - Responses get truncated due to token limits
3. **Poor error recovery** - Timeouts result in complete failure with no partial results
4. **No retry logic** - Failed requests aren't retried automatically

## Requirements

### Requirement 1: Robust Timeout Handling

**User Story:** As a user requesting a large prototype, I want the system to handle long generation times gracefully, so that I don't experience unexpected failures.

#### Acceptance Criteria

1. WHEN a generation request is made THEN the system SHALL set appropriate timeout values based on request complexity
2. WHEN streaming is in progress THEN the system SHALL monitor for activity and extend timeout if data is being received
3. IF a timeout occurs THEN the system SHALL preserve any partial response received
4. WHEN a timeout is detected THEN the system SHALL attempt to parse and use partial JSON responses
5. IF partial response is usable THEN the system SHALL present it to the user with a warning
6. WHEN timeout occurs THEN the system SHALL log detailed information for debugging
7. WHEN streaming completes THEN the system SHALL verify the response is complete before processing

### Requirement 2: Automatic Retry Logic

**User Story:** As a user experiencing a generation failure, I want the system to automatically retry, so that temporary issues don't require manual intervention.

#### Acceptance Criteria

1. WHEN a generation request fails THEN the system SHALL automatically retry up to 3 times
2. WHEN retrying THEN the system SHALL use exponential backoff (2s, 4s, 8s)
3. IF the failure is due to timeout THEN the system SHALL increase the timeout for the retry
4. IF the failure is due to rate limiting THEN the system SHALL wait the appropriate time before retrying
5. WHEN retrying THEN the system SHALL inform the user that a retry is in progress
6. IF all retries fail THEN the system SHALL provide a clear error message with suggestions
7. WHEN a retry succeeds THEN the system SHALL proceed normally without additional user notification

### Requirement 3: Incomplete Response Handling

**User Story:** As a user receiving a truncated response, I want the system to detect and handle incomplete JSON, so that I get usable results even if the response was cut off.

#### Acceptance Criteria

1. WHEN parsing a response THEN the system SHALL detect if JSON is incomplete (unclosed braces, truncated strings)
2. IF JSON is incomplete THEN the system SHALL attempt to complete it by adding missing closing braces
3. WHEN completing JSON THEN the system SHALL validate that required fields (html, css, js) are present
4. IF required fields are missing THEN the system SHALL mark the response as incomplete
5. WHEN a response is incomplete THEN the system SHALL show a warning to the user
6. IF html field is present but css/js are missing THEN the system SHALL use the html with empty css/js
7. WHEN an incomplete response is used THEN the system SHALL offer to regenerate with a simpler prompt

### Requirement 4: Progress Feedback During Long Operations

**User Story:** As a user waiting for a large prototype to generate, I want to see that progress is being made, so that I know the system hasn't frozen.

#### Acceptance Criteria

1. WHEN streaming starts THEN the system SHALL show an initial progress indicator
2. WHEN data is being received THEN the system SHALL update progress indicators every 2-3 seconds
3. WHEN no data has been received for 10 seconds THEN the system SHALL show a "still working" message
4. IF generation is taking longer than expected THEN the system SHALL show estimated time remaining
5. WHEN streaming completes THEN the system SHALL show a completion message
6. IF an error occurs THEN the system SHALL show a clear error message with the failure reason
7. WHEN retrying THEN the system SHALL show retry attempt number and reason

### Requirement 5: Streaming Reliability Improvements

**User Story:** As a developer, I want the streaming implementation to be robust and handle edge cases, so that users have a reliable experience.

#### Acceptance Criteria

1. WHEN streaming THEN the system SHALL handle network interruptions gracefully
2. IF connection is lost THEN the system SHALL attempt to reconnect and resume
3. WHEN parsing SSE events THEN the system SHALL handle malformed events without crashing
4. IF an event parsing error occurs THEN the system SHALL log the error and continue processing
5. WHEN accumulating streamed content THEN the system SHALL handle large responses efficiently
6. IF memory usage becomes high THEN the system SHALL implement backpressure to slow the stream
7. WHEN streaming ends THEN the system SHALL properly close all connections and clean up resources

### Requirement 6: Enhanced Error Messages

**User Story:** As a user experiencing an error, I want clear, actionable error messages, so that I know what went wrong and what to do next.

#### Acceptance Criteria

1. WHEN a timeout occurs THEN the system SHALL show "Generation took too long. Retrying with optimized settings..."
2. WHEN JSON parsing fails THEN the system SHALL show "Received incomplete response. Using partial results..."
3. WHEN all retries fail THEN the system SHALL show "Unable to generate. Try simplifying your request or breaking it into smaller parts."
4. IF rate limit is hit THEN the system SHALL show "API rate limit reached. Waiting X seconds before retry..."
5. WHEN network error occurs THEN the system SHALL show "Connection lost. Retrying..."
6. IF LLM returns an error THEN the system SHALL show the specific error message from the LLM
7. WHEN showing errors THEN the system SHALL include a "Try Again" button for manual retry

### Requirement 7: Prompt Optimization for Large Requests

**User Story:** As a user requesting a complex prototype, I want the system to optimize prompts for large outputs, so that generation is more likely to succeed.

#### Acceptance Criteria

1. WHEN a request appears complex THEN the system SHALL use a more concise prompt template
2. WHEN generating large prototypes THEN the system SHALL prioritize essential code over comments
3. IF a request mentions multiple features THEN the system SHALL focus on core functionality first
4. WHEN prompting the LLM THEN the system SHALL explicitly request compact, production-ready code
5. IF a generation fails due to length THEN the system SHALL retry with a simplified prompt
6. WHEN retrying THEN the system SHALL ask for minimal viable implementation
7. WHEN generation succeeds THEN the system SHALL offer to enhance the prototype with additional features
