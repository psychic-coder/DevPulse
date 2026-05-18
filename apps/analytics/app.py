import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from services import CommitAnalyser, LanguageAnalyser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "analytics"}), 200


@app.route('/analyse/commits', methods=['POST'])
def analyse_commits():
    """
    Analyze commit patterns and generate analytics.
    
    Expected JSON input:
    {
        "commits": [
            {
                "sha": "abc123",
                "committed_at": "2025-01-01T10:00:00Z",
                "additions": 120,
                "deletions": 30
            },
            ...
        ]
    }
    
    Returns commit analytics with peak hours, streaks, frequency distributions, etc.
    """
    try:
        data = request.get_json()
        
        if not data or 'commits' not in data:
            return jsonify({
                "error": "Missing 'commits' field in request body"
            }), 400

        commits = data['commits']
        
        if not isinstance(commits, list):
            return jsonify({
                "error": "'commits' must be an array"
            }), 400

        if len(commits) == 0:
            return jsonify({
                "error": "commits array cannot be empty"
            }), 400

        # Validate commit structure
        required_fields = ['committed_at', 'additions', 'deletions']
        for commit in commits:
            for field in required_fields:
                if field not in commit:
                    return jsonify({
                        "error": f"Each commit must have '{field}' field"
                    }), 400

        # Analyze commits
        analyser = CommitAnalyser(commits)
        result = analyser.analyse()

        logger.info(f"Analyzed {len(commits)} commits successfully")
        return jsonify(result), 200

    except ValueError as e:
        logger.error(f"ValueError: {str(e)}")
        return jsonify({
            "error": f"Invalid data format: {str(e)}"
        }), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500


@app.route('/analyse/languages', methods=['POST'])
def analyse_languages():
    """
    Analyze programming language distribution across repositories.
    
    Expected JSON input:
    {
        "repositories": [
            {
                "name": "repo-name",
                "language": "TypeScript",
                "bytes": 50000
            },
            ...
        ]
    }
    
    Returns language distribution, statistics, and diversity metrics.
    """
    try:
        data = request.get_json()
        
        if not data or 'repositories' not in data:
            return jsonify({
                "error": "Missing 'repositories' field in request body"
            }), 400

        repositories = data['repositories']
        
        if not isinstance(repositories, list):
            return jsonify({
                "error": "'repositories' must be an array"
            }), 400

        if len(repositories) == 0:
            return jsonify({
                "error": "repositories array cannot be empty"
            }), 400

        # Validate repository structure
        for repo in repositories:
            if 'language' not in repo or 'bytes' not in repo:
                return jsonify({
                    "error": "Each repository must have 'language' and 'bytes' fields"
                }), 400

        # Analyze languages
        analyser = LanguageAnalyser(repositories)
        result = analyser.analyse()

        logger.info(f"Analyzed {len(repositories)} repositories successfully")
        return jsonify(result), 200

    except ValueError as e:
        logger.error(f"ValueError: {str(e)}")
        return jsonify({
            "error": f"Invalid data format: {str(e)}"
        }), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500


@app.route('/info', methods=['GET'])
def info():
    """Return service information."""
    return jsonify({
        "service": "DevPulse Analytics Engine",
        "version": "1.0.0",
        "endpoints": [
            "GET /health",
            "GET /info",
            "POST /analyse/commits",
            "POST /analyse/languages"
        ]
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        "error": "Endpoint not found",
        "status": 404
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors."""
    return jsonify({
        "error": "Method not allowed",
        "status": 405
    }), 405


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
