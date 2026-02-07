
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, Tag, BrainCircuit, AlertCircle, ChevronDown, ChevronUp, Sparkles, Layout, Clock, MessageCircle, Send, Bell, BellOff, X, PlusCircle, RotateCcw, Timer, Edit2, Check, XCircle, AlertTriangle, List, ChevronLeft, ChevronRight, CalendarDays, History, Share, Monitor, Settings2, Moon, Sun, Save } from 'lucide-react';
import { Task, Priority, Category, SubTask } from './types';
import { Badge } from './components/Badge';
import { suggestSubtasks, getMotivationalMessage } from './services/geminiService';

const WHATSAPP_NUMBER = "526632213821";

type NotificationMethod = 'browser' | 'in-app';
type Theme = 'light' | 'dark';

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; isDark: boolean }> = ({ label, value, icon, isDark }) => (
  <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-4 rounded-xl border shadow-sm hover:shadow-md transition-all`}>
    <div className="flex items-center justify-between mb-1">
      <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>{label}</span>
      {icon}
    </div>
    <div className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</div>
  </div>
);

const TaskCard: React.FC<{
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (task: Task) => void;
  onAISuggest: () => void;
  onAIRegenerate: () => void;
  loadingAI: boolean;
  onToggleSubtask: (subtaskId: string) => void;
  onSetReminder: (time?: string) => void;
  isDark: boolean;
}> = ({ task, onToggle, onDelete, onUpdate, onAISuggest, onAIRegenerate, loadingAI, onToggleSubtask, onSetReminder, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editDueDate, setEditDueDate] = useState(task.dueDate);

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate({ 
        ...task, 
        title: editTitle,
        description: editDesc,
        priority: editPriority,
        category: editCategory,
        dueDate: editDueDate
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDueDate(task.dueDate);
    setIsEditing(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareMessage = `📋 Tarea compartida de ZenTask AI:\n\n📌 ${task.title}\n📝 ${task.description || 'Sin descripción'}\n📅 Vence: ${task.dueDate || 'Sin fecha'}\n🚀 Prioridad: ${task.priority.toUpperCase()}\n\n¡Organizado con ZenTask AI!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'ZenTask AI - Tarea',
        text: shareMessage,
      }).catch(console.error);
    } else {
      alert(`Simulando Compartir:\n\n${shareMessage}`);
    }
  };

  const isImminent = useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    const now = new Date();
    const due = new Date(task.dueDate + 'T23:59:59');
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diff >= 0 && diff <= 24;
  }, [task.dueDate, task.completed]);

  const formattedCreationDate = useMemo(() => {
    return new Date(task.createdAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [task.createdAt]);

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-800';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`${cardBg} border rounded-xl overflow-hidden transition-all hover:shadow-md ${task.completed ? 'opacity-80' : 'shadow-sm'} ${isImminent && !task.completed ? 'animate-pulse-red border-l-4' : 'border-l-4 border-l-transparent'}`}>
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 gap-3">
              <input 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)}
                className={`w-full px-3 py-2 text-sm font-semibold border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-indigo-200 text-slate-900'}`}
                placeholder="Título de la tarea"
                autoFocus
              />
              <textarea 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                placeholder="Descripción"
                rows={2}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select 
                  value={editPriority} 
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className={`px-2 py-2 text-xs border rounded-lg outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                >
                  <option value={Priority.LOW}>Prioridad Baja</option>
                  <option value={Priority.MEDIUM}>Prioridad Media</option>
                  <option value={Priority.HIGH}>Prioridad Alta</option>
                </select>
                <select 
                  value={editCategory} 
                  onChange={(e) => setEditCategory(e.target.value as Category)}
                  className={`px-2 py-2 text-xs border rounded-lg outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                >
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input 
                  type="date" 
                  value={editDueDate} 
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className={`px-2 py-2 text-xs border rounded-lg outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                <X size={14} /> Cancelar
              </button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1">
                <Check size={14} /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <button onClick={onToggle} className={`mt-1 transition-colors ${task.completed ? 'text-emerald-500' : isDark ? 'text-slate-600 hover:text-indigo-400' : 'text-slate-300 hover:text-indigo-500'}`}>
              {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge type={task.priority} label={task.priority === Priority.HIGH ? 'ALTA' : task.priority === Priority.MEDIUM ? 'MEDIA' : 'BAJA'} />
                  <Badge type="category" label={task.category} />
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`} title={`Creado el ${formattedCreationDate}`}>
                      <History size={10} />
                      {formattedCreationDate.split(',')[0]}
                    </span>
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 text-xs ${isImminent ? 'text-red-600 font-bold' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <CalendarIcon size={12} />
                        {task.dueDate}
                        {isImminent && <AlertTriangle size={12} className="ml-1" />}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handleShare} className={`p-1.5 rounded-md transition-all ${isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} title="Compartir tarea">
                    <Share size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAISuggest(); setIsExpanded(true); }} 
                    disabled={loadingAI}
                    className={`p-1.5 rounded-md transition-all ${isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'} ${loadingAI ? 'animate-pulse' : ''}`} 
                    title="Sugerir subtareas con IA"
                  >
                    <Sparkles size={16} className={loadingAI ? 'text-indigo-500' : ''} />
                  </button>
                  <button onClick={() => setIsEditing(true)} className={`p-1.5 rounded-md transition-all ${isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} title="Editar tarea">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setIsExpanded(!isExpanded)} className={`p-1.5 rounded-md transition-all ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={onDelete} className={`p-1.5 rounded-md transition-all ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 
                className={`font-semibold text-lg leading-tight cursor-pointer ${task.completed ? 'line-through opacity-50' : textPrimary}`}
                onClick={() => setIsEditing(true)}
              >
                {task.title}
              </h3>
              
              {task.description && (
                <p className={`${textSecondary} text-sm mt-1 line-clamp-2`}>{task.description}</p>
              )}
            </div>
          </div>
        )}

        {isExpanded && !isEditing && (
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-4 animate-in fade-in slide-in-from-top-2 duration-200`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <List size={12} />
                  Subtareas
                </h4>
                <div className="flex gap-2">
                   <button 
                    disabled={loadingAI}
                    onClick={onAISuggest}
                    className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-500/20 disabled:opacity-50 transition-all"
                  >
                    {loadingAI ? <RotateCcw size={10} className="animate-spin" /> : <PlusCircle size={10} />}
                    Añadir Sugerencias
                  </button>
                  {task.subtasks.length > 0 && (
                    <button 
                      disabled={loadingAI}
                      onClick={onAIRegenerate}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 transition-all ${isDark ? 'text-slate-400 bg-slate-800 hover:bg-slate-700' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}
                    >
                      <RotateCcw size={10} />
                      Regenerar
                    </button>
                  )}
                </div>
              </div>
              
              {task.subtasks.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No hay subtareas aún.</p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5">
                  {task.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 group">
                      <button onClick={() => onToggleSubtask(st.id)} className={`transition-colors ${st.completed ? 'text-emerald-500' : isDark ? 'text-slate-600 hover:text-indigo-400' : 'text-slate-300 hover:text-indigo-400'}`}>
                        {st.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                      <span className={`text-sm ${st.completed ? 'opacity-50 line-through' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>{st.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`flex flex-wrap items-center gap-4 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-50'} mt-2`}>
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-slate-500" />
                <input 
                  type="datetime-local" 
                  className={`text-xs border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                  value={task.reminderTime || ''}
                  onChange={(e) => onSetReminder(e.target.value)}
                />
              </div>
              {task.reminderTime && (
                <button 
                  onClick={() => onSetReminder(undefined)}
                  className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 font-medium"
                >
                  <BellOff size={12} /> Quitar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Persistencia del tema
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  
  // Persistencia de las tareas - CLAVE para evitar borrado de datos en actualizaciones
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('zen_tasks');
    try {
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (e) {
      console.error("Error cargando tareas guardadas", e);
      return [];
    }
  });

  // Persistencia del método de notificación
  const [notifMethod, setNotifMethod] = useState<NotificationMethod>(() => 
    (localStorage.getItem('zen_notif_method') as NotificationMethod) || 'in-app'
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [category, setCategory] = useState<Category>(Category.WORK);
  const [dueDate, setDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [motivation, setMotivation] = useState('ZenTask AI: Tu mente fuera de tu cabeza.');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'upcoming'>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [activeInAppAlert, setActiveInAppAlert] = useState<string | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Guardado automático en localStorage cuando cambian las tareas o preferencias
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('zen_tasks', JSON.stringify(tasks));
    // Mostrar breve indicador de autoguardado para tranquilidad del usuario
    setShowSaveIndicator(true);
    const timer = setTimeout(() => setShowSaveIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('zen_notif_method', notifMethod);
  }, [notifMethod]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((task: Task, reason: 'reminder' | 'deadline') => {
    const message = reason === 'reminder' 
      ? `⏰ Recordatorio: ${task.title}` 
      : `⚠️ Vence hoy: ${task.title}`;
    const body = task.description || "¡Es hora de completar esta tarea!";

    if (notifMethod === 'browser' && Notification.permission === "granted") {
      new Notification(message, {
        body,
        icon: "https://cdn-icons-png.flaticon.com/512/2098/2098402.png"
      });
    } else {
      setActiveInAppAlert(`${message}\n${body}`);
      setTimeout(() => setActiveInAppAlert(null), 8000);
    }
  }, [notifMethod]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.completed) {
          if (task.reminderTime) {
            const reminderDate = new Date(task.reminderTime);
            if (reminderDate <= now && (now.getTime() - reminderDate.getTime()) < 60000) {
              showNotification(task, 'reminder');
              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, reminderTime: undefined } : t));
            }
          }
        }
      });
    };
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, showNotification]);

  useEffect(() => {
    const fetchMotivation = async () => {
      const pendingCount = tasks.filter(t => !t.completed).length;
      const msg = await getMotivationalMessage(pendingCount);
      setMotivation(msg);
    };
    fetchMotivation();
  }, [tasks.length]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      priority,
      category,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: Date.now(),
      subtasks: []
    };
    setTasks(prev => [newTask, ...prev]);
    resetForm();
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(Priority.MEDIUM);
    setCategory(Category.WORK);
    setDueDate('');
    setIsAdding(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta tarea?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const setTaskReminder = (id: string, time?: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, reminderTime: time } : t));
  };

  const handleAISuggestions = async (id: string, replace: boolean = false) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setLoadingAI(id);
    try {
      const suggestions = await suggestSubtasks(task.title, task.description);
      const newSubtasks: SubTask[] = suggestions.map(s => ({
        id: crypto.randomUUID(),
        title: s,
        completed: false
      }));
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            subtasks: replace ? newSubtasks : [...t.subtasks, ...newSubtasks]
          };
        }
        return t;
      }));
    } finally {
      setLoadingAI(null);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        };
      }
      return t;
    }));
  };

  const sendSummaryToWhatsApp = () => {
    const pending = tasks.filter(t => !t.completed);
    if (pending.length === 0) {
      alert("No tienes tareas pendientes.");
      return;
    }
    let message = `*ZenTask AI - Resumen*\n\n`;
    pending.forEach((t, i) => {
      message += `${i + 1}. *${t.title}* [${t.priority}]\n`;
    });
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filter === 'pending') result = result.filter(t => !t.completed);
    else if (filter === 'completed') result = result.filter(t => t.completed);
    else if (filter === 'upcoming') {
      result = result.filter(t => !t.completed).sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return filter === 'upcoming' ? result : result.sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, filter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    high: tasks.filter(t => t.priority === Priority.HIGH && !t.completed).length
  }), [tasks]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let i = 1; i <= days; i++) {
      arr.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
    }
    return arr;
  }, [calendarDate]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  const changeMonth = (offset: number) => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-20 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Alerta In-App Personalizada */}
      {activeInAppAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-top-full duration-500">
          <div className={`${isDark ? 'bg-slate-900 border-indigo-500 text-white' : 'bg-white border-indigo-500'} border-2 shadow-2xl rounded-2xl p-4 flex items-start gap-4`}>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-full">
              <Bell className="animate-bounce" size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold whitespace-pre-line">{activeInAppAlert}</p>
            </div>
            <button onClick={() => setActiveInAppAlert(null)} className="p-1 text-slate-500 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Indicador de Autoguardado */}
      <div className={`fixed bottom-4 right-4 z-[90] flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-500 ${showSaveIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-white border border-slate-200 text-emerald-600 shadow-sm'}`}>
        <Save size={12} />
        Autoguardado
      </div>

      <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <BrainCircuit size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">ZenTask AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme} 
                className={`p-2 rounded-lg transition-all ${isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title={isDark ? "Modo claro" : "Modo oscuro"}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className={`flex p-1 rounded-lg mr-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} title="Método de Recordatorio">
                <button 
                  onClick={() => setNotifMethod('browser')} 
                  className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${notifMethod === 'browser' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-indigo-400'}`}
                >
                  <Bell size={16} />
                  <span className="text-[10px] font-bold hidden sm:inline">Nav</span>
                </button>
                <button 
                  onClick={() => setNotifMethod('in-app')} 
                  className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${notifMethod === 'in-app' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-indigo-400'}`}
                >
                  <Monitor size={16} />
                  <span className="text-[10px] font-bold hidden sm:inline">App</span>
                </button>
              </div>

              <div className={`flex p-1 rounded-lg mr-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-all ${view === 'list' ? (isDark ? 'bg-slate-700 text-indigo-400' : 'bg-white shadow-sm text-indigo-600') : 'text-slate-500'}`}><List size={18} /></button>
                <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md transition-all ${view === 'calendar' ? (isDark ? 'bg-slate-700 text-indigo-400' : 'bg-white shadow-sm text-indigo-600') : 'text-slate-500'}`}><CalendarIcon size={18} /></button>
              </div>
              
              <button onClick={sendSummaryToWhatsApp} className={`p-2 rounded-lg transition-all ${isDark ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-emerald-600 hover:bg-emerald-50'}`} title="WhatsApp"><MessageCircle size={20} /></button>
              
              <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95">
                {isAdding ? <X size={20} /> : <Plus size={20} />}
                <span className="hidden sm:inline">{isAdding ? 'Cerrar' : 'Nueva'}</span>
              </button>
            </div>
          </div>
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border transition-colors duration-300 ${isDark ? 'text-slate-400 bg-slate-800/50 border-slate-800' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
            <Sparkles size={16} className="text-amber-500 animate-pulse flex-shrink-0" />
            <p className="italic line-clamp-1">{motivation}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {view === 'list' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Pendientes" value={stats.pending} icon={<Clock className="text-amber-500" size={18} />} isDark={isDark} />
              <StatCard label="Completas" value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" size={18} />} isDark={isDark} />
              <StatCard label="Urgentes" value={stats.high} icon={<AlertCircle className="text-red-500" size={18} />} isDark={isDark} />
              <StatCard label="Total" value={stats.total} icon={<Layout className="text-indigo-500" size={18} />} isDark={isDark} />
            </div>

            {isAdding && (
              <div className={`border rounded-xl p-6 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <form onSubmit={addTask} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Título</label>
                    <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} placeholder="¿Qué necesitas hacer?" />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Descripción</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} placeholder="Detalles..." rows={2} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                      <option value={Priority.LOW}>Baja</option>
                      <option value={Priority.MEDIUM}>Media</option>
                      <option value={Priority.HIGH}>Alta</option>
                    </select>
                    <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                      {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-all">Crear Tarea</button>
                    <button type="button" onClick={resetForm} className={`px-6 py-2 border rounded-lg hover:bg-slate-50 transition-all ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-300'}`}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            <div className={`flex items-center gap-1 p-1 rounded-lg border shadow-sm mb-6 w-fit ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              {['all', 'pending', 'upcoming', 'completed'].map((f) => (
                <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-400'}`}>
                  {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'upcoming' ? 'Próximas' : 'Hechas'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className={`text-center py-20 border border-dashed rounded-2xl text-slate-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'}`}>
                  <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No hay tareas</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onToggle={() => toggleTask(task.id)} 
                    onDelete={() => deleteTask(task.id)} 
                    onUpdate={updateTask} 
                    onAISuggest={() => handleAISuggestions(task.id, false)} 
                    onAIRegenerate={() => handleAISuggestions(task.id, true)}
                    loadingAI={loadingAI === task.id}
                    onToggleSubtask={(subId) => toggleSubtask(task.id, subId)}
                    onSetReminder={(time) => setTaskReminder(task.id, time)}
                    isDark={isDark}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className={`border rounded-2xl shadow-sm overflow-hidden mb-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h2 className="font-bold text-lg capitalize">{calendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h2>
              <div className="flex gap-1">
                <button onClick={() => changeMonth(-1)} className={`p-2 rounded-lg border border-transparent transition-all ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white hover:border-slate-200'}`}><ChevronLeft size={20} /></button>
                <button onClick={() => setCalendarDate(new Date())} className="px-3 py-1 text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all">Hoy</button>
                <button onClick={() => changeMonth(1)} className={`p-2 rounded-lg border border-transparent transition-all ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white hover:border-slate-200'}`}><ChevronRight size={20} /></button>
              </div>
            </div>
            <div className={`grid grid-cols-7 gap-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className={`p-2 text-center text-[10px] font-bold uppercase ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>{d}</div>)}
              {calendarDays.map((date, i) => {
                const dayTasks = date ? tasksByDay[date] || [] : [];
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div key={i} onClick={() => date && setSelectedDay(date)} className={`min-h-[100px] p-2 transition-all cursor-pointer relative ${!date ? (isDark ? 'bg-slate-950/50' : 'bg-slate-50/50') : (isDark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-slate-50')} ${selectedDay === date ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-500/10' : ''}`}>
                    {date && (
                      <>
                        <span className={`text-sm font-semibold mb-1 block ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : (isDark ? 'text-slate-400' : 'text-slate-600')}`}>{parseInt(date.split('-')[2])}</span>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 2).map(t => (
                            <div key={t.id} className={`text-[10px] truncate px-1 py-0.5 rounded border-l-2 ${t.completed ? (isDark ? 'bg-slate-800 text-slate-500 border-slate-600' : 'bg-slate-100 text-slate-400 border-slate-300') : (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500' : 'bg-indigo-50 text-indigo-600 border-indigo-500')}`}>{t.title}</div>
                          ))}
                          {dayTasks.length > 2 && <div className="text-[10px] text-slate-500 font-bold">+ {dayTasks.length - 2}</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedDay && (
              <div className={`p-6 border-t animate-in slide-in-from-bottom-4 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><CalendarDays size={18} className="text-indigo-600" /> Tareas para el {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h3>
                  <button onClick={() => setSelectedDay(null)} className="text-slate-500 hover:text-red-500 transition-all"><XCircle size={22} /></button>
                </div>
                <div className="space-y-3">
                  {tasksByDay[selectedDay]?.map(task => (
                    <TaskCard 
                      key={task.id} task={task} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} onUpdate={updateTask} onAISuggest={() => handleAISuggestions(task.id, false)} onAIRegenerate={() => handleAISuggestions(task.id, true)} loadingAI={loadingAI === task.id} onToggleSubtask={(subId) => toggleSubtask(task.id, subId)} onSetReminder={(time) => setTaskReminder(task.id, time)} isDark={isDark}
                    />
                  )) || <p className="text-slate-500 italic text-sm">No hay tareas para este día.</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
