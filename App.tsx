
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarView } from './components/CalendarView.tsx';
import { TodoListView } from './components/TodoListView.tsx';
import { DayTodoData, ViewMode, Category, PASTEL_COLORS, User, TodoItem } from './types.ts';
import { getKSTDate, formatDateKey } from './utils/dateUtils.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

// 1. 환경 변수 로드 (Vite 표준인 import.meta.env 사용)
const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const supabaseKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';
const kakaoJsKey = ((import.meta as any).env?.VITE_KAKAO_JS_KEY as string) || '';

// Supabase 클라이언트 초기화
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(getKSTDate());
  const [currentMonth, setCurrentMonth] = useState<Date>(getKSTDate());
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const STORAGE_KEY_TODOS_GUEST = 'kst_calendar_todos_guest';
  const STORAGE_KEY_CATS_GUEST = 'kst_calendar_categories_guest';

  const [categories, setCategories] = useState<Category[]>([]);
  const [todos, setTodos] = useState<DayTodoData>({});

  // 2. 초기화 및 사용자 인증 상태 추적
  useEffect(() => {
    // 카카오 SDK 초기화
    const Kakao = (window as any).Kakao;
    if (kakaoJsKey && Kakao && !Kakao.isInitialized()) {
      Kakao.init(kakaoJsKey);
      console.log('✅ Kakao SDK Initialized');
    }

    if (!supabase) return;

    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) updateLocalUser(session.user);
    });

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        updateLocalUser(session.user);
      } else {
        setUser(null);
        setTodos({});
        setCategories([
          { id: 'cat-1', name: 'Work', color: PASTEL_COLORS[0] },
          { id: 'cat-2', name: 'Personal', color: PASTEL_COLORS[1] }
        ]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateLocalUser = (sbUser: any) => {
    setUser({
      id: sbUser.id,
      nickname: sbUser.user_metadata.full_name || sbUser.user_metadata.nickname || 'Guest User',
      profileImage: sbUser.user_metadata.avatar_url || ''
    });
  };

  // 3. 데이터 불러오기 (Cloud / Local)
  const fetchCloudData = useCallback(async () => {
    if (!user || !supabase) return;
    setIsSyncing(true);
    try {
      const { data: catData, error: catError } = await supabase.from('categories').select('*');
      if (catError) throw catError;
      if (catData && catData.length > 0) {
        setCategories(catData.map(c => ({ id: c.id, name: c.name, color: c.color })));
      }

      const { data: todoData, error: todoError } = await supabase.from('todos').select('*');
      if (todoError) throw todoError;
      if (todoData) {
        const grouped: DayTodoData = {};
        todoData.forEach(t => {
          if (!grouped[t.date_key]) grouped[t.date_key] = [];
          grouped[t.date_key].push({
            id: t.id,
            text: t.text,
            completed: t.completed,
            createdAt: new Date(t.created_at).getTime(),
            categoryId: t.category_id || 'default'
          });
        });
        setTodos(grouped);
      }
    } catch (error) {
      console.error('❌ Cloud fetch error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCloudData();
    } else {
      const savedCats = localStorage.getItem(STORAGE_KEY_CATS_GUEST);
      if (savedCats) setCategories(JSON.parse(savedCats));
      else setCategories([
        { id: 'cat-1', name: 'Work', color: PASTEL_COLORS[0] },
        { id: 'cat-2', name: 'Personal', color: PASTEL_COLORS[1] }
      ]);
      const savedTodos = localStorage.getItem(STORAGE_KEY_TODOS_GUEST);
      if (savedTodos) setTodos(JSON.parse(savedTodos));
    }
  }, [user, fetchCloudData]);

  // 4. 데이터 저장 핸들러
  const updateCategories = async (newCats: Category[]) => {
    setCategories(newCats);
    if (user && supabase) {
      setIsSyncing(true);
      try {
        await supabase.from('categories').delete().eq('user_id', user.id);
        const toInsert = newCats.map(c => ({
          name: c.name,
          color: c.color,
          user_id: user.id
        }));
        await supabase.from('categories').insert(toInsert);
      } finally {
        setIsSyncing(false);
      }
    } else {
      localStorage.setItem(STORAGE_KEY_CATS_GUEST, JSON.stringify(newCats));
    }
  };

  const updateDayTodos = async (dateKey: string, newTodos: TodoItem[]) => {
    setTodos(prev => ({ ...prev, [dateKey]: newTodos }));
    if (user && supabase) {
      setIsSyncing(true);
      try {
        await supabase.from('todos').delete().eq('user_id', user.id).eq('date_key', dateKey);
        if (newTodos.length > 0) {
          const toInsert = newTodos.map(t => ({
            text: t.text,
            completed: t.completed,
            category_id: (t.categoryId === 'default' || t.categoryId.includes('cat-')) ? null : t.categoryId,
            date_key: dateKey,
            user_id: user.id,
            created_at: new Date(t.createdAt).toISOString()
          }));
          await supabase.from('todos').insert(toInsert);
        }
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updatedTodos = { ...todos, [dateKey]: newTodos };
      localStorage.setItem(STORAGE_KEY_TODOS_GUEST, JSON.stringify(updatedTodos));
    }
  };

  // 5. 인증 핸들러
  const handleLogin = async () => {
    if (!supabase) {
      alert('.env.local 설정이 필요합니다.\n\nVITE_SUPABASE_URL\nVITE_SUPABASE_ANON_KEY\nVITE_KAKAO_JS_KEY');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login Error:', error.message);
      alert(`로그인 실패: ${error.message}\n\n카카오 개발자 콘솔의 [카카오 로그인 > Redirect URI] 항목에 Supabase의 Callback URL이 등록되어 있는지 확인해주세요.`);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error.message);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] flex flex-col items-center justify-start p-0 md:p-4 lg:p-8">
      <div className="w-full max-w-7xl bg-white md:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col h-[100dvh] md:h-auto md:min-h-[800px] transition-all duration-500">
        {!supabase && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-center space-x-2">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">⚠️ Offline Mode: Setup Supabase in .env.local to sync</span>
          </div>
        )}
        {isSyncing && (
          <div className="absolute top-4 right-4 z-[100] flex items-center space-x-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-sm animate-pulse">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cloud Syncing</span>
          </div>
        )}
        {viewMode === 'calendar' ? (
          <CalendarView currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} onDateClick={handleDateClick} todos={todos} categories={categories} setCategories={updateCategories} user={user} onLogin={handleLogin} onLogout={handleLogout} />
        ) : (
          <TodoListView date={selectedDate} onBack={() => setViewMode('calendar')} todos={todos[formatDateKey(selectedDate)] || []} setTodos={(newTodos) => updateDayTodos(formatDateKey(selectedDate), newTodos)} categories={categories} setCategories={updateCategories} />
        )}
      </div>
    </div>
  );
};

export default App;
