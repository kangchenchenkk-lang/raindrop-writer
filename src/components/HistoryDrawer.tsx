import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Search, 
  FileText, 
  ArrowUpLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export interface SavedInspiration {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inspirations: SavedInspiration[];
  onReload: (item: SavedInspiration) => void;
  onDelete: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  inspirations,
  onReload,
  onDelete,
  onShowToast
}: HistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, item: SavedInspiration) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${item.title}\n\n${item.content}`);
    setCopiedId(item.id);
    onShowToast('灵感内容已成功复制 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReloadClick = (item: SavedInspiration) => {
    onReload(item);
    onClose();
  };

  const filteredInspirations = inspirations.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-full sm:w-[400px] bg-black/40 backdrop-blur-2xl border-r border-white/15 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
    }`}>
      
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-[#E5A7B8]" />
          <h2 className="text-base font-bold text-white tracking-tight">雨天氛围写作</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          title="关闭面板"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-transparent">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-white/30 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="搜索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-[#E5A7B8]/20 focus:ring-[0.5px] focus:ring-[#E5A7B8]/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-white/20 focus:outline-none transition-all font-light"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-white/40 hover:text-white/70 text-xs py-0.5 px-1.5 rounded bg-white/10"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar pb-16">
        {filteredInspirations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/30">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/60 font-light">
                {searchQuery ? '没有找到匹配的灵感' : '雨落长街，笔尖未落'}
              </p>
              <p className="text-[11px] text-white/30 font-light">
                {searchQuery ? '尝试换一个关键词搜索吧' : '写下想法，并点击右下角“保存到写作室”'}
              </p>
            </div>
          </div>
        ) : (
          filteredInspirations.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleReloadClick(item)}
              className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#E5A7B8]/30 hover:bg-white/10 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[120px] select-none"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-sm font-medium text-white tracking-wide truncate pr-4 group-hover:text-[#E5A7B8] transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-1 text-[10px] text-white/40 font-light shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{item.createdAt}</span>
                  </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-light line-clamp-3 break-all mb-4">
                  {item.content}
                </p>
              </div>

              {/* Card Actions Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-auto">
                <span className="text-[10px] text-[#E5A7B8]/60 group-hover:text-[#E5A7B8] flex items-center space-x-0.5 font-light">
                  <ArrowUpLeft className="w-3 h-3" />
                  <span>载入编辑器</span>
                </span>
                
                <div className="flex items-center space-x-1">
                  {/* Copy Button */}
                  <button
                    onClick={(e) => handleCopy(e, item)}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-white/50 hover:text-white transition-colors cursor-pointer"
                    title="快速复制此灵感"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除这篇灵感记录吗？')) {
                        onDelete(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition-colors cursor-pointer"
                    title="永久删除此灵感"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
