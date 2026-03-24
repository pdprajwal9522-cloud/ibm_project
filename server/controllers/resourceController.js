import axios from 'axios';

const YT_BASE = 'https://www.googleapis.com/youtube/v3/search';

export const getLearningResources = async (req, res) => {
    try {
        const skill = (req.query.skill || '').trim();
        if (!skill) {
            return res.status(400).json({ success: false, error: { message: 'Skill is required.' } });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: { message: 'YouTube API key not configured.' } });
        }

        const { data } = await axios.get(YT_BASE, {
            params: {
                part: 'snippet',
                maxResults: 6,
                type: 'video',
                q: `${skill} tutorial roadmap`,
                key: apiKey,
                safeSearch: 'moderate',
            },
        });

        const videos = (data.items || []).map((item) => ({
            title: item.snippet?.title,
            channel: item.snippet?.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        })).filter((v) => v.url && v.title);

        return res.status(200).json({ success: true, data: { videos } });
    } catch (err) {
        console.error('[Resources API] Error fetching YouTube links:', err.response?.data || err.message);
        return res.status(500).json({ success: false, error: { message: 'Could not fetch resources. Please try again.' } });
    }
};
