
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, List, Plus, X, Trash2, Info, Check, LogIn, LogOut } from 'lucide-react';
import { getMonthDetails, monthNames, dayNames, formatDateKey, getKSTDate } from '../utils/dateUtils.ts';
import { DayTodoData, Category, PASTEL_COLORS, FIXED_DEFAULT_COLOR, User } from '../types.ts';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  onDateClick: (date: Date) => void;
  todos: DayTodoData;
  categories: Category[];
  setCategories: (newCats: Category[]) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  currentMonth, 
  setCurrentMonth, 
  onDateClick, 
  todos,
  categories,
  setCategories,
  user,
  onLogin,
  onLogout
}) => {
  const [showCatPanel, setShowCatPanel] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showCoachMark, setShowCoachMark] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const { firstDay, daysInMonth } = getMonthDetails(year, month);
  const today = getKSTDate();
  const todayKey = formatDateKey(today);

  useEffect(() => {
    const hasSeen = localStorage.getItem('seen_calendar_tutorial');
    if (!hasSeen) {
      setShowCoachMark(true);
    }
  }, []);

  useEffect(() => {
    if (editingCatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCatId]);

  const dismissCoachMark = () => {
    setShowCoachMark(false);
    localStorage.setItem('seen_calendar_tutorial', 'true');
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToToday = () => {
      const kst = getKSTDate();
      setCurrentMonth(new Date(kst.getFullYear(), kst.getMonth(), 1));
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      color: PASTEL_COLORS[categories.length % PASTEL_COLORS.length]
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
  };

  const updateCategoryColor = (id: string, color: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, color } : c));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const startEditingCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingValue(cat.name);
  };

  const saveCatName = () => {
    if (editingCatId && editingValue.trim()) {
      setCategories(categories.map(c => c.id === editingCatId ? { ...c, name: editingValue.trim() } : c));
    }
    setEditingCatId(null);
  };

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[80px] md:min-h-[140px] border-b border-r border-gray-100 bg-gray-50/30"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateKey = formatDateKey(date);
      const dayTodos = todos[dateKey] || [];
      const isToday = dateKey === todayKey;

      let categorySummary = categories.map(cat => {
        const catTodos = dayTodos.filter(t => t.categoryId === cat.id);
        if (catTodos.length === 0) return null;
        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          total: catTodos.length,
          completed: catTodos.filter(t => t.completed).length,
          allDone: catTodos.length > 0 && catTodos.every(t => t.completed)
        };
      }).filter(Boolean);

      const unCategorized = dayTodos.filter(t => t.categoryId === 'default' || !categories.find(c => c.id === t.categoryId));
      if (unCategorized.length > 0) {
        categorySummary.unshift({
          id: 'default',
          name: '기본 할 일',
          color: FIXED_DEFAULT_COLOR,
          total: unCategorized.length,
          completed: unCategorized.filter(t => t.completed).length,
          allDone: unCategorized.every(t => t.completed)
        });
      }

      cells.push(
        <button 
          key={d} 
          onClick={() => onDateClick(date)}
          className="min-h-[80px] md:min-h-[140px] border-b border-r border-gray-100 flex flex-col items-start p-1 md:p-2 transition-colors hover:bg-gray-50 active:bg-gray-100 relative group overflow-hidden"
        >
          <span className={`text-xs md:text-base font-semibold w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full mb-1 md:mb-2 ${
            isToday ? 'bg-[#FF3B30] text-white' : 'text-[#1c1c1e]'
          }`}>
            {d}
          </span>
          
          <div className="flex flex-col gap-0.5 md:gap-1 w-full overflow-hidden">
            {categorySummary.map((summary: any) => (
              <div 
                key={summary.id}
                className={`flex items-center space-x-1 px-1 py-0.5 rounded-md text-[8px] md:text-[10px] font-bold truncate transition-opacity border-l-2 md:border-l-[3px] ${
                  summary.allDone ? 'opacity-30 grayscale-[0.8]' : 'opacity-100'
                }`}
                style={{ 
                  backgroundColor: `${summary.color}30`,
                  color: '#1c1c1e',
                  borderLeftColor: summary.color
                }}
              >
                <span className="truncate flex-grow text-left hidden md:inline">{summary.name}</span>
                <span className="flex-shrink-0 tabular-nums mx-auto md:mx-0">{summary.completed}/{summary.total}</span>
              </div>
            ))}
          </div>
        </button>
      );
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = firstDay + daysInMonth; i < totalCells; i++) {
        cells.push(<div key={`empty-end-${i}`} className="min-h-[80px] md:min-h-[140px] border-b border-r border-gray-100 bg-gray-50/30"></div>);
    }

    return cells;
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <AnimatePresence>
        {showCoachMark && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-[4px] flex flex-col items-start p-6 md:p-10 pointer-events-auto"
            onClick={dismissCoachMark}
          >
            <motion.div 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="mt-20 md:mt-16 bg-white p-6 rounded-[28px] shadow-2xl max-w-[280px] flex flex-col gap-4 relative border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45" />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-500">
                  <Info size={20} />
                  <h4 className="font-bold text-[#1c1c1e]">도움말</h4>
                </div>
                <p className="text-sm text-gray-600 leading-snug">
                  왼쪽 위 메뉴를 눌러 <span className="font-bold text-[#FF3B30]">나만의 태그</span>를 관리하고 이름을 클릭해 수정해보세요.
                </p>
              </div>
              <button 
                onClick={dismissCoachMark}
                className="mt-2 w-full py-2.5 bg-[#FF3B30] text-white font-bold rounded-2xl active:scale-95 transition-all shadow-md"
              >
                확인했습니다
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="p-4 md:p-8 flex items-center justify-between border-b border-gray-200 apple-blur sticky top-0 z-20">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={() => setShowCatPanel(!showCatPanel)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#FF3B30] relative"
            title="태그 관리"
          >
            <List size={24} />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-[#FF3B30]">{monthNames[month]}</h1>
            <p className="text-gray-500 text-xs md:text-base font-medium">{year}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={prevMonth} className="p-1 md:p-2 hover:bg-white rounded-lg transition-all shadow-sm">
            <ChevronLeft size={20} className="text-[#FF3B30] md:w-6 md:h-6" />
          </button>
          <button onClick={goToToday} className="px-2 md:px-4 py-1.5 text-[10px] md:text-sm font-bold text-gray-600 hover:text-[#FF3B30] transition-colors uppercase tracking-tight">
            Today
          </button>
          <button onClick={nextMonth} className="p-1 md:p-2 hover:bg-white rounded-lg transition-all shadow-sm">
            <ChevronRight size={20} className="text-[#FF3B30] md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
        {dayNames.map((day, i) => (
          <div key={day} className={`py-2 md:py-3 text-center text-[8px] md:text-xs font-bold uppercase tracking-widest ${
            i === 0 ? 'text-[#FF3B30]' : i === 6 ? 'text-blue-500' : 'text-gray-400'
          }`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-gray-100 flex-grow overflow-y-auto no-scrollbar">
        {renderCells()}
      </div>

      {showCatPanel && (
        <div className="absolute inset-0 z-30 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCatPanel(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1c1c1e]">Calendars</h3>
              <button onClick={() => setShowCatPanel(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="px-6 py-4 border-b border-gray-50">
              {user ? (
                <div className="flex items-center space-x-3">
                  <img src={user.profileImage} alt={user.nickname} className="w-10 h-10 rounded-full border border-gray-100 shadow-sm" />
                  <div className="flex-grow">
                    <p className="text-xs text-gray-400 font-bold uppercase">Logged in as</p>
                    <p className="text-sm font-bold text-[#1c1c1e]">{user.nickname}</p>
                  </div>
                  <button onClick={onLogout} className="p-2 hover:bg-red-50 text-red-400 rounded-full transition-colors" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={onLogin}
                    className="w-full flex items-center justify-center space-x-2 py-3 kakao-login-btn rounded-xl font-bold shadow-sm active:scale-[0.98] transition-all"
                  >
                    <LogIn size={18} />
                    <span>카카오로 시작하기</span>
                  </button>
                  <p className="text-[10px] text-center text-gray-400 leading-tight">
                    기기간 데이터 동기화와 개인 프로필 표시를 위해 <br/> 닉네임 및 프로필 사진 정보가 사용됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="group flex flex-col space-y-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                      {editingCatId === cat.id ? (
                        <div className="flex items-center flex-grow space-x-2">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={saveCatName}
                            onKeyDown={(e) => e.key === 'Enter' && saveCatName()}
                            className="bg-white border border-gray-200 rounded px-2 py-1 text-sm font-semibold w-full focus:outline-none focus:border-[#FF3B30]"
                          />
                          <button onClick={saveCatName} className="text-green-500">
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditingCat(cat)}
                          className="font-semibold text-[#1c1c1e] truncate cursor-pointer hover:underline decoration-[#FF3B30]/30 text-left"
                        >
                          {cat.name}
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => removeCategory(cat.id)} 
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {PASTEL_COLORS.map(color => (
                      <button 
                        key={color} 
                        onClick={() => updateCategoryColor(cat.id, color)}
                        className={`w-6 h-6 rounded-full border-2 ${cat.color === color ? 'border-[#1c1c1e] shadow-inner' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="새 캘린더 이름..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  className="flex-grow p-2 rounded-lg bg-gray-100 focus:outline-none text-sm font-medium border border-transparent focus:border-gray-200 text-[#1c1c1e]"
                />
                <button 
                  onClick={addCategory}
                  className="p-2 bg-[#FF3B30] text-white rounded-lg shadow-lg active:scale-95 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
