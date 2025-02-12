import React from 'react';
import { MessageCircle, Wallet, Anchor, Heart, MessageSquare, Bookmark, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App';

export function Home() {
  const { walletAddress } = useContext(AuthContext);

  const stories = [
    { id: 1, name: 'Vitalik', avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=70&h=70&fit=crop' },
    { id: 2, name: 'SBF', avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=70&h=70&fit=crop', viewed: true },
    { id: 3, name: 'CZ', avatar: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=70&h=70&fit=crop' },
    // Add more stories as needed
  ];

  const posts = [
    {
      id: 1,
      user: 'Zaid Shabir',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=600&fit=crop',
      likes: 1234,
      description: 'Building the future of Web3 messaging! 🚀 #Kraken #Web3 #Blockchain',
      timeAgo: '2 hours ago'
    },
    // Add more posts as needed
  ];

  return (
    <div className="max-w-xl mx-auto py-4 px-4">
      {/* Stories */}
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1">
            <div className={`story-ring ${story.viewed ? 'viewed' : ''}`}>
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img src={story.avatar} alt={story.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-xs">{story.name}</span>
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-6 mt-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-zinc-900 rounded-lg overflow-hidden">
            {/* Post header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <img src={post.avatar} alt={post.user} className="w-8 h-8 rounded-full" />
                <span className="font-semibold">{post.user}</span>
              </div>
              <button>
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post image */}
            <img src={post.image} alt="" className="w-full aspect-square object-cover" />

            {/* Post actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button>
                    <Heart className="w-6 h-6" />
                  </button>
                  <button>
                    <MessageSquare className="w-6 h-6" />
                  </button>
                </div>
                <button>
                  <Bookmark className="w-6 h-6" />
                </button>
              </div>

              <p className="font-semibold mb-1">{post.likes.toLocaleString()} likes</p>
              <p>
                <span className="font-semibold mr-2">{post.user}</span>
                {post.description}
              </p>
              <p className="text-zinc-400 text-sm mt-2">{post.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Features */}
      <div className="mt-8 bg-zinc-900 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Coming Soon</h2>
        <div className="grid gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">NFT Messaging</h3>
              <p className="text-sm text-zinc-400">Message holders of specific NFTs</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Cross-chain Bridge</h3>
              <p className="text-sm text-zinc-400">Connect across different blockchains</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}