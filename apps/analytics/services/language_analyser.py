from typing import List, Dict, Any
from collections import defaultdict
import pandas as pd


class LanguageAnalyser:
    """Analyzes programming language distribution in repositories."""

    def __init__(self, repositories: List[Dict[str, Any]]):
        """
        Initialize analyzer with repository data.
        
        Args:
            repositories: List of repo dicts with 'language' and 'bytes' fields
                         Example: [{"language": "TypeScript", "bytes": 50000}, ...]
        """
        self.repositories = repositories

    def get_language_distribution(self) -> Dict[str, float]:
        """
        Calculate percentage breakdown by language.
        
        Returns:
            Dict mapping language names to percentage (0-100)
        """
        if not self.repositories:
            return {}

        # Sum bytes per language
        language_bytes = defaultdict(int)
        for repo in self.repositories:
            language = repo.get('language', 'Unknown')
            bytes_count = repo.get('bytes', 0)
            if language and bytes_count > 0:
                language_bytes[language] += bytes_count

        # Calculate total and percentages
        total_bytes = sum(language_bytes.values())
        if total_bytes == 0:
            return {}

        distribution = {
            lang: round((bytes_val / total_bytes) * 100, 2)
            for lang, bytes_val in language_bytes.items()
        }

        # Sort by percentage descending
        return dict(sorted(distribution.items(), key=lambda x: x[1], reverse=True))

    def get_language_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        Get detailed statistics per language.
        
        Returns:
            Dict with language as key, containing:
            - percentage: percentage of total bytes
            - bytes: total bytes
            - repo_count: number of repos using this language
        """
        if not self.repositories:
            return {}

        language_stats = defaultdict(lambda: {"bytes": 0, "repo_count": 0})

        for repo in self.repositories:
            language = repo.get('language', 'Unknown')
            bytes_count = repo.get('bytes', 0)
            if language and bytes_count > 0:
                language_stats[language]["bytes"] += bytes_count
                language_stats[language]["repo_count"] += 1

        # Calculate total and percentages
        total_bytes = sum(stat["bytes"] for stat in language_stats.values())
        if total_bytes == 0:
            return {}

        # Add percentages and format
        result = {}
        for language, stats in language_stats.items():
            result[language] = {
                "percentage": round((stats["bytes"] / total_bytes) * 100, 2),
                "bytes": stats["bytes"],
                "repo_count": stats["repo_count"],
            }

        # Sort by percentage descending
        return dict(sorted(result.items(), key=lambda x: x[1]["percentage"], reverse=True))

    def get_top_languages(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get top N languages by percentage.
        
        Args:
            limit: Number of top languages to return
            
        Returns:
            List of dicts with language, percentage, bytes, repo_count
        """
        stats = self.get_language_stats()
        if not stats:
            return []

        top = []
        for language, data in list(stats.items())[:limit]:
            top.append({
                "language": language,
                "percentage": data["percentage"],
                "bytes": data["bytes"],
                "repo_count": data["repo_count"],
            })

        return top

    def get_language_diversity(self) -> Dict[str, Any]:
        """
        Calculate language diversity metrics.
        
        Returns:
            Dict with:
            - total_languages: number of different languages
            - primary_language: most used language
            - primary_percentage: percentage of primary language
            - is_polyglot: True if using 3+ languages
        """
        stats = self.get_language_stats()
        if not stats:
            return {
                "total_languages": 0,
                "primary_language": None,
                "primary_percentage": 0,
                "is_polyglot": False,
            }

        sorted_langs = sorted(stats.items(), key=lambda x: x[1]["bytes"], reverse=True)
        primary_lang, primary_stats = sorted_langs[0]

        return {
            "total_languages": len(stats),
            "primary_language": primary_lang,
            "primary_percentage": primary_stats["percentage"],
            "is_polyglot": len(stats) >= 3,
        }

    def analyse(self) -> Dict[str, Any]:
        """
        Generate complete language analytics.
        
        Returns:
            Dictionary with all language metrics
        """
        return {
            "distribution": self.get_language_distribution(),
            "stats": self.get_language_stats(),
            "top_languages": self.get_top_languages(5),
            "diversity": self.get_language_diversity(),
        }
