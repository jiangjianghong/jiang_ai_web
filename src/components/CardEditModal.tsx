import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { uploadFaviconToStorage } from '@/lib/supabaseFaviconUpload';

const websiteSchema = z.object({
  name: z.string().min(1, '网站名不能为空'),
  url: z.string().url('请输入有效的网址'),
  favicon: z.string().url('请输入有效的图标URL'),
  note: z.string().optional(),
});

interface CardEditModalProps {
  id: string;
  name: string;
  url: string;
  favicon: string;
  tags: string[];
  note?: string;
  onClose: () => void;
  onSave: (data: {
    id: string;
    name: string;
    url: string;
    favicon: string;
    tags: string[];
    note?: string;
  }) => void;
  onDelete?: (id: string) => void;
}

export default function CardEditModal({ id, name, url, favicon, tags: _, note, onClose, onSave, onDelete }: CardEditModalProps) {
  const [formData, setFormData] = useState({
    name,
    url,
    favicon,
    note: note || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoFetching, setAutoFetching] = useState(false);
  const [uploading, setUploading] = useState(false);

  const extractTags = (text: string) => {
    const tagRegex = /\{([^}]+)\}/g;
    const matches = text.match(tagRegex) || [];
    return matches.map(tag => tag.replace(/\{|\}/g, '').trim());
  };

  const removeTagsFromNote = (text: string) => {
    return text.replace(/\{[^}]+\}/g, '').trim();
  };

  const handleAutoFetch = async () => {
    if (!formData.url || !formData.url.startsWith('http')) {
      setErrors({ url: '请输入有效的网址(以http://或https://开头)' });
      return;
    }

    try {
      setAutoFetching(true);
      const domain = new URL(formData.url).hostname;
      
      // 清除该域名的 favicon 缓存，确保获取最新图标
      const extractDomain = (url: string) => {
        try {
          return new URL(url).hostname.replace(/^www\./, '');
        } catch {
          return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        }
      };
      
      const cacheDomain = extractDomain(formData.url);
      console.log('🧹 清除域名缓存:', cacheDomain);
      
      // 清除旧的缓存
      try {
        const cacheKey = 'favicon-cache-simple';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cacheData = JSON.parse(cached);
          delete cacheData[cacheDomain];
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        }
      } catch (error) {
        console.warn('清除缓存失败:', error);
      }
      
      // 生成新的 favicon URL，添加时间戳确保不被缓存
      const timestamp = Date.now();
      const newFaviconUrl = `https://www.google.com/s2/favicons?domain=${formData.url}&sz=64&t=${timestamp}`;
      
      // 自动获取favicon
      setFormData(prev => ({
        ...prev,
        favicon: newFaviconUrl
      }));

      // 自动获取网站名
      setFormData(prev => ({
        ...prev,
        name: domain.replace('www.', '').split('.')[0]
      }));

      // 清除错误
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.url;
        return newErrors;
      });
      
      console.log('✅ 自动获取完成，新图标:', newFaviconUrl);
    } catch (error) {
      console.error('自动获取信息失败:', error);
      setErrors({ url: '无法解析该网址，请检查格式是否正确' });
    } finally {
      setAutoFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      const result = websiteSchema.safeParse(formData);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        return;
      }

      // 提取标签并清理备注
      const newTags = extractTags(formData.note || '');
      const cleanedNote = removeTagsFromNote(formData.note || '');
      
      // 只有当图标发生变化时才上传到 Firebase Storage
      let finalFaviconUrl = formData.favicon;
      
      if (formData.favicon !== favicon) {
        console.log('🔄 图标已变更，开始上传到数据库...');
        try {
          finalFaviconUrl = await uploadFaviconToStorage(formData.favicon, id);
          console.log('✅ 图标上传完成:', finalFaviconUrl);
        } catch (uploadError) {
          console.warn('⚠️ 图标上传失败，使用原始URL:', uploadError);
          // 上传失败不阻止保存，继续使用原始URL
        }
      } else {
        console.log('📋 图标未变更，跳过上传');
      }
      
      // 如果 favicon 发生了变化，清除缓存
      if (formData.favicon !== favicon) {
        console.log('🔄 Favicon 已更改，清除缓存');
        const extractDomain = (url: string) => {
          try {
            return new URL(url).hostname.replace(/^www\./, '');
          } catch {
            return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
          }
        };
        
        const cacheDomain = extractDomain(formData.url);
        try {
          const cacheKey = 'favicon-cache-simple';
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const cacheData = JSON.parse(cached);
            delete cacheData[cacheDomain];
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log('🧹 已清除域名缓存:', cacheDomain);
          }
        } catch (error) {
          console.warn('清除缓存失败:', error);
        }
      }
      
      // 保存逻辑
      onSave({
        id,
        name: formData.name,
        url: formData.url,
        favicon: finalFaviconUrl, // 使用上传后的URL
        tags: newTags, // 只保留新标签
        note: cleanedNote
      });

      onClose();
    } catch (error) {
      console.error('保存失败:', error);
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 select-none">
      <motion.div
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 select-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="flex justify-between items-center mb-4 select-none">
          <h2 className="text-xl font-semibold select-none">编辑卡片</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 select-none">
            <i className="fa-solid fa-xmark select-none"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 select-none">网址</label>
            <div className="flex gap-2">
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
              <button
                type="button"
                onClick={handleAutoFetch}
                disabled={autoFetching || !formData.url}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 select-none"
              >
                {autoFetching ? '获取中...' : '自动获取'}
              </button>
            </div>
            {errors.url && <p className="mt-1 text-sm text-red-500 select-none">{errors.url}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 select-none">网站名</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="网站名称"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500 select-none">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 select-none">图标</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  name="favicon"
                  value={formData.favicon}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
              <span className="text-gray-400 select-none">或</span>
              <label className="cursor-pointer select-none">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setFormData(prev => ({
                            ...prev,
                            favicon: event.target?.result as string
                          }));
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors select-none">
                  <i className="fa-solid fa-upload mr-1 select-none"></i>上传
                </div>
              </label>
            </div>
            {formData.favicon && (
              <div className="mt-2 flex items-center select-none">
                <img 
                  src={formData.favicon} 
                  alt="图标预览" 
                  className="w-8 h-8 rounded mr-2 select-none"
                />
                <span className="text-xs text-gray-500 truncate max-w-xs select-none">
                  {formData.favicon.startsWith('data:image') ? '上传的图标' : formData.favicon}
                </span>
              </div>
            )}
            {errors.favicon && <p className="mt-1 text-sm text-red-500 select-none">{errors.favicon}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 select-none">
                 备注 (使用{}标记标签，如: 备注内容 {'工作'} {'代码'})
            </label>
            <div className="text-xs text-gray-500 mb-1 select-none">
              花括号{}内的内容会被识别为标签
            </div>

            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="网站用途说明..."
            />
          </div>


           <div className="flex flex-col gap-4 pt-4 select-none">
              <div className="flex gap-2 select-none">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50 select-none"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed select-none"
                >
                  {uploading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      上传中...
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
              
              {/* 保存错误提示 */}
              {errors.submit && (
                <p className="text-red-500 text-sm text-center select-none">
                  {errors.submit}
                </p>
              )}
              
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('确定要删除这个卡片吗？')) {
                      onDelete(id);
                      onClose();
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-md select-none"
                >
                  <i className="fa-solid fa-trash mr-2 select-none"></i>删除卡片
                </button>
              )}
            </div>



        </form>
      </motion.div>
    </div>
  );
}