from datetime import datetime, timedelta
from collections import defaultdict, Counter
import pandas as pd
from typing import List, Dict, Any, Tuple


class CommitAnalyser:
    """Analyzes commit patterns and generates analytics."""

    def __init__(self, commits: List[Dict[str, Any]]):
        """
        Initialize analyzer with commit data.
        
        Args:
            commits: List of commit dicts with 'committed_at', 'additions', 'deletions'
        """
        self.commits = commits
        self.df = self._prepare_dataframe()

    def _prepare_dataframe(self) -> pd.DataFrame:
        """Convert commits list to DataFrame with parsed timestamps."""
        if not self.commits:
            return pd.DataFrame()
        
        df = pd.DataFrame(self.commits)
        df['committed_at'] = pd.to_datetime(df['committed_at'])
        df['hour'] = df['committed_at'].dt.hour
        df['day_of_week'] = df['committed_at'].dt.day_name()
        df['date'] = df['committed_at'].dt.date
        return df

    def get_peak_hour(self) -> int:
        """Return hour of day (0-23) with most commits."""
        if self.df.empty:
            return 0
        hour_counts = self.df['hour'].value_counts()
        return int(hour_counts.idxmax()) if not hour_counts.empty else 0

    def get_peak_day(self) -> str:
        """Return day of week with most commits."""
        if self.df.empty:
            return "Monday"
        day_counts = self.df['day_of_week'].value_counts()
        return day_counts.idxmax() if not day_counts.empty else "Monday"

    def get_avg_daily_commits(self) -> float:
        """Return average commits per day."""
        if self.df.empty:
            return 0.0
        daily_counts = self.df.groupby('date').size()
        return round(float(daily_counts.mean()), 2)

    def get_commit_frequency_by_hour(self) -> Dict[str, int]:
        """Return commit count for each hour of day (0-23)."""
        frequency = {str(hour): 0 for hour in range(24)}
        if not self.df.empty:
            hour_counts = self.df['hour'].value_counts().to_dict()
            for hour, count in hour_counts.items():
                frequency[str(int(hour))] = int(count)
        return frequency

    def get_commit_frequency_by_day(self) -> Dict[str, int]:
        """Return commit count for each day of week."""
        day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        frequency = {day: 0 for day in day_order}
        if not self.df.empty:
            day_counts = self.df['day_of_week'].value_counts().to_dict()
            for day, count in day_counts.items():
                frequency[day] = int(count)
        return frequency

    def get_total_additions_deletions(self) -> Tuple[int, int]:
        """Return total additions and deletions."""
        if self.df.empty:
            return 0, 0
        total_additions = int(self.df['additions'].sum())
        total_deletions = int(self.df['deletions'].sum())
        return total_additions, total_deletions

    def calculate_streaks(self) -> Tuple[int, int]:
        """
        Calculate longest streak and current streak in consecutive days with commits.
        
        Returns:
            Tuple of (longest_streak_days, current_streak_days)
        """
        if self.df.empty:
            return 0, 0

        # Get unique dates with commits, sorted in reverse
        commit_dates = sorted(set(self.df['date'].tolist()), reverse=True)
        
        if not commit_dates:
            return 0, 0

        # Calculate current streak (from today backwards)
        today = datetime.now().date()
        current_streak = 0
        check_date = today
        
        for _ in range(365):  # Check up to 1 year back
            if check_date in commit_dates:
                current_streak += 1
                check_date -= timedelta(days=1)
            elif check_date > max(commit_dates):
                # Haven't reached oldest commit yet, but no commit today
                check_date -= timedelta(days=1)
            else:
                # Streak broken
                break

        # Calculate longest streak
        commit_dates_sorted = sorted(commit_dates)
        longest_streak = 1
        current_run = 1

        for i in range(1, len(commit_dates_sorted)):
            if commit_dates_sorted[i] - commit_dates_sorted[i-1] == timedelta(days=1):
                current_run += 1
                longest_streak = max(longest_streak, current_run)
            else:
                current_run = 1

        # Handle edge case of single commit
        if len(commit_dates_sorted) == 1:
            longest_streak = 1

        return longest_streak, current_streak

    def analyse(self) -> Dict[str, Any]:
        """
        Generate complete commit analytics.
        
        Returns:
            Dictionary with all computed metrics
        """
        total_additions, total_deletions = self.get_total_additions_deletions()
        longest_streak, current_streak = self.calculate_streaks()

        return {
            "peak_hour": self.get_peak_hour(),
            "peak_day": self.get_peak_day(),
            "avg_daily_commits": self.get_avg_daily_commits(),
            "longest_streak_days": longest_streak,
            "current_streak_days": current_streak,
            "total_additions": total_additions,
            "total_deletions": total_deletions,
            "commit_frequency_by_hour": self.get_commit_frequency_by_hour(),
            "commit_frequency_by_day": self.get_commit_frequency_by_day(),
        }
