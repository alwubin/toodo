
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, Check, Tag, GripVertical, Type, Lightbulb, Sparkles, Loader2 } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { TodoItem, Category, FIXED_DEFAULT_COLOR, PASTEL_COLORS } from '../types.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type as GenAIType } from "@google/genai";

interface TodoListViewProps {
  date: Date;
  onBack: () => void;
  todos: TodoItem[];
  setTodos: (newTodos: TodoItem[]) => void;
  categories: Category[];
  setCategories: (newCats: Category[]) => void;
}

const DEFAULT_CAT_ID = 'default';

export const TodoListView: React.FC<TodoListViewProps> = ({ 
  date, 
  onBack, 
  todos, 
  setTodos,
  categories,
  setCategories,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CAT_ID);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showCoachMark, setShowCoachMark] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  const formattedDate = date.toLocaleDateString('ko-KR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    const hasSeen = localStorage.getItem('seen_todo_tutorial');
    if (!hasSeen) {
      setShowCoachMark(true);
    }
  }, []);

  useEffect(() => {
    if (editingCatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCatId]);

  useEffect(() => {
    if (isAddingTag && newTagInputRef.current) {
      newTagInputRef.current.focus();
    }
  }, [isAddingTag]);

  const dismissCoachMark = () => {
    setShowCoachMark(false);
    localStorage.setItem('seen_todo_tutorial', 'true');
  };

  const addTodo = (text: string, categoryId: string = selectedCategoryId) => {
    if (!text.trim()) return;

    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
      categoryId: categoryId
    };

    setTodos([...todos, newItem]);
    setInputValue('');
  };

  const handleSuggestTodos = async () => {
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentCat = categories.find(c => c.id === selectedCategoryId)?.name || "기본";
      const existingTodos = todos.map(t => t.text).join(", ");
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `당신은 할 일 관리 비서입니다. 
        날짜: ${formattedDate}
        현재 카테고리: ${currentCat}
        이미 계획된 일: ${existingTodos || "없음"}
        
        이 상황에 어울리는 새로운 할 일 3가지를 한국어로 추천해주세요. 
        답변은 반드시 JSON 배열 형태여야 합니다. 예: ["운동하기", "책 읽기", "장보기"]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.ARRAY,
            items: { type: GenAIType.STRING }
          }
        }
      });

      const suggestions = JSON.parse(response.text || "[]");
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI Suggestion Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleReorder = (newOrder: TodoItem[]) => {
    setTodos(newOrder);
  };

  const startEditingCat = (id: string, currentName: string) => {
    if (id === DEFAULT_CAT_ID) return;
    setEditingCatId(id);
    setEditingValue(currentName);
  };

  const saveCatName = () => {
    if (editingCatId && editingValue.trim()) {
      setCategories(categories.map(c => c.id === editingCatId ? { ...c, name: editingValue.trim() } : c));
    }
    setEditingCatId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 md:duration-500 relative overflow-hidden">
      <AnimatePresence>
        {showCoachMark && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-[4px] flex flex-col items-center justify-center p-6 pointer-events-auto"
            onClick={dismissCoachMark}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-[40px] shadow-2xl max-w-sm flex flex-col gap-8 border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-yellow-50 text-yellow-500 rounded-full">
                  <Lightbulb size={32} />
                </div>
                <h4 className="text-xl font-bold text-[#1c1c1e] mt-2">유용한 팁</h4>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-blue-50 text-blue-500 rounded-xl">
                    <GripVertical size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#1c1c1e] text-sm">리스트 순서 변경</h5>
                    <p className="text-sm text-gray-500">할 일 왼쪽의 핸들을 잡고 <span className="text-[#1c1c1e] font-semibold">드래그</span>하여 순서를 바꿔보세요.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-purple-50 text-purple-500 rounded-xl">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#1c1c1e] text-sm">AI 할 일 추천</h5>
                    <p className="text-sm text-gray-500">입력창 옆의 <span className="text-purple-600 font-semibold">반짝이 버튼</span>을 눌러 AI의 추천을 받아보세요.</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={dismissCoachMark}
                className="w-full py-4 bg-[#FF3B30] text-white font-bold rounded-3xl active:scale-95 transition-all shadow-lg"
              >
                확인했습니다
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="p-4 md:p-10 flex items-center border-b border-gray-200 apple-blur sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 md:p-3 md:-ml-4 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={28} className="text-[#FF3B30] md:w-8 md:h-8" />
        </button>
        <div className="ml-3 md:ml-4">
          <h2 className="text-lg md:text-3xl font-bold text-[#1c1c1e] tracking-tight">{formattedDate}</h2>
          <p className="text-xs md:text-lg text-gray-500 font-medium">{todos.length}개의 일정</p>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-0.5 no-scrollbar max-w-4xl mx-auto w-full">
        {isAiLoading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 animate-pulse">
            <Loader2 className="animate-spin text-purple-500" size={32} />
            <p className="text-sm font-bold text-purple-600 uppercase tracking-widest">AI 비서가 생각 중입니다...</p>
          </div>
        )}

        <AnimatePresence>
          {aiSuggestions.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-purple-50 rounded-3xl p-4 border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Sparkles size={16} className="text-purple-500" />
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">AI의 추천</span>
                </div>
                <div className="flex flex-col gap-2">
                  {aiSuggestions.map((text, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        addTodo(text);
                        setAiSuggestions(prev => prev.filter(s => s !== text));
                      }}
                      className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:border-purple-300 border border-transparent transition-all group"
                    >
                      <span>{text}</span>
                      <Plus size={16} className="text-purple-300 group-hover:text-purple-500" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {todos.length === 0 && !isAiLoading && aiSuggestions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60 space-y-4 py-10 md:py-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
                <Plus size={28} className="md:w-8 md:h-8" />
            </div>
            <p className="text-sm md:text-xl font-medium text-[#1c1c1e]/40 text-center px-6">일정이 없습니다. 새로운 할 일을 추가해보세요!</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={todos} onReorder={handleReorder}>
            {todos.map(todo => {
              const cat = categories.find(c => c.id === todo.categoryId);
              const itemColor = cat ? cat.color : FIXED_DEFAULT_COLOR;
              const catName = cat ? cat.name : '기본 할 일';

              return (
                <Reorder.Item 
                  key={todo.id} 
                  value={todo}
                  whileDrag={{ scale: 1.02, cursor: 'grabbing', zIndex: 10 }}
                >
                  <div className={`flex items-center px-4 py-2 md:px-6 md:py-3 rounded-2xl transition-all group relative border-none shadow-none hover:bg-gray-50/50`}>
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: itemColor }} />
                    <div className="mr-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 cursor-grab active:cursor-grabbing">
                      <GripVertical size={18} />
                    </div>
                    <button 
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 border-2 ${
                        todo.completed ? 'scale-105' : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ 
                        backgroundColor: todo.completed ? itemColor : 'transparent',
                        borderColor: todo.completed ? itemColor : undefined 
                      }}
                    >
                      {todo.completed && <Check size={18} className="text-white" strokeWidth={3} />}
                    </button>
                    <div className="ml-4 flex-grow flex flex-col">
                      <span className={`text-base md:text-lg font-medium transition-all ${
                        todo.completed ? 'line-through text-gray-400' : 'text-[#1c1c1e]'
                      }`}>
                        {todo.text}
                      </span>
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5 flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: itemColor }}></div>
                        <span>{catName}</span>
                      </span>
                    </div>
                    <button onClick={() => deleteTodo(todo.id)} className="p-2 text-gray-200 hover:text-[#FF3B30] opacity-100 md:opacity-0 group-hover:opacity-100 transition-all ml-2">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </div>

      <div className="p-4 md:p-10 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <Tag size={14} className="text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setSelectedCategoryId(DEFAULT_CAT_ID)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                selectedCategoryId === DEFAULT_CAT_ID ? 'bg-[#1c1c1e]/10 text-[#1c1c1e]' : 'bg-gray-50 text-gray-400'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: FIXED_DEFAULT_COLOR }}></div>
              <span>기본 할 일</span>
            </button>
            {categories.map(cat => (
              <div key={cat.id} className="relative flex-shrink-0">
                {editingCatId === cat.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={saveCatName}
                    onKeyDown={(e) => e.key === 'Enter' && saveCatName()}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] font-bold bg-white border border-[#1c1c1e]/20 focus:outline-none w-32 text-[#1c1c1e]"
                  />
                ) : (
                  <button
                    onClick={() => selectedCategoryId === cat.id ? startEditingCat(cat.id, cat.name) : setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                      selectedCategoryId === cat.id ? 'bg-[#1c1c1e]/10 text-[#1c1c1e]' : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span>{cat.name}</span>
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setIsAddingTag(true)} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Plus size={18} />
            </button>
          </div>
          <form 
            onSubmit={(e) => { e.preventDefault(); addTodo(inputValue); }} 
            className="flex items-center space-x-2 md:space-x-3 bg-gray-100 p-1.5 md:p-2 rounded-[24px] md:rounded-3xl border border-gray-200"
          >
            <input 
              type="text" placeholder="새로운 할 일..." value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow bg-transparent px-3 py-2 md:px-5 md:py-3 text-base md:text-xl focus:outline-none placeholder-gray-400 text-[#1c1c1e]"
            />
            <button 
              type="button"
              onClick={handleSuggestTodos}
              disabled={isAiLoading}
              className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${
                isAiLoading ? 'bg-gray-200 text-gray-400' : 'bg-white text-purple-500 hover:text-purple-600 shadow-sm'
              }`}
              title="AI 추천받기"
            >
              <Sparkles size={20} className="md:w-7 md:h-7" />
            </button>
            <button type="submit" disabled={!inputValue.trim()} className="p-3 md:p-4 bg-[#FF3B30] text-white rounded-xl md:rounded-2xl shadow-lg active:scale-95 disabled:opacity-50">
              <Plus size={20} className="md:w-7 md:h-7" strokeWidth={3} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
