import { Project, Task, Transaction, Goal, GoalTransaction, Note, Reminder } from './types';
import { subDays, addDays, subMonths, format } from 'date-fns';

const now = new Date();
const today = format(now, 'yyyy-MM-dd');
const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
const in3Days = format(addDays(now, 3), 'yyyy-MM-dd');
const in7Days = format(addDays(now, 7), 'yyyy-MM-dd');
const in14Days = format(addDays(now, 14), 'yyyy-MM-dd');
const in30Days = format(addDays(now, 30), 'yyyy-MM-dd');
const ago3Days = format(subDays(now, 3), 'yyyy-MM-dd');
const ago7Days = format(subDays(now, 7), 'yyyy-MM-dd');

export function getSeedData() {
    const projects: Project[] = [
        { id: 'proj-1', name: 'Web Sitesi Projesi', color: '#3b82f6', description: 'Şirket web sitesi yeniden tasarımı', createdAt: subMonths(now, 2).toISOString(), updatedAt: now.toISOString() },
        { id: 'proj-2', name: 'Kişisel Gelişim', color: '#8b5cf6', description: 'Kişisel hedefler ve öğrenme planı', createdAt: subMonths(now, 1).toISOString(), updatedAt: now.toISOString() },
        { id: 'proj-3', name: 'Ev Tadilatı', color: '#f59e0b', description: 'Mutfak ve banyo yenileme', createdAt: subDays(now, 20).toISOString(), updatedAt: now.toISOString() },
    ];

    const tasks: Task[] = [
        // Web Sitesi Projesi - Ana görevler
        { id: 'task-1', projectId: 'proj-1', parentId: null, title: 'Tasarım Aşaması', description: 'Web sitesi tasarım sürecini tamamla', status: 'in-progress', priority: 'high', tags: ['İş'], startDate: ago7Days, dueDate: in3Days, estimatedHours: 20, actualHours: 12, progress: 60, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 0, createdAt: subDays(now, 14).toISOString(), updatedAt: now.toISOString() },
        { id: 'task-1a', projectId: 'proj-1', parentId: 'task-1', title: 'Wireframe hazırla', description: 'Ana sayfalar için wireframe çiz', status: 'done', priority: 'high', tags: ['İş'], startDate: ago7Days, dueDate: ago3Days, estimatedHours: 5, actualHours: 4, progress: 100, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 0, createdAt: subDays(now, 14).toISOString(), updatedAt: subDays(now, 3).toISOString() },
        { id: 'task-1b', projectId: 'proj-1', parentId: 'task-1', title: 'UI mockup oluştur', description: 'Figma ile detaylı mockup', status: 'in-progress', priority: 'high', tags: ['İş'], startDate: ago3Days, dueDate: tomorrow, estimatedHours: 8, actualHours: 5, progress: 65, repeatRule: 'none', dependsOn: 'task-1a', archived: false, orderIndex: 1, createdAt: subDays(now, 10).toISOString(), updatedAt: now.toISOString() },
        { id: 'task-1c', projectId: 'proj-1', parentId: 'task-1', title: 'Renk paleti ve tipografi', description: 'Marka uyumlu renk ve font seçimi', status: 'todo', priority: 'medium', tags: ['İş'], startDate: null, dueDate: in3Days, estimatedHours: 3, actualHours: null, progress: 0, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 2, createdAt: subDays(now, 10).toISOString(), updatedAt: now.toISOString() },

        { id: 'task-2', projectId: 'proj-1', parentId: null, title: 'Frontend Geliştirme', description: 'React ile frontend kodlama', status: 'todo', priority: 'high', tags: ['İş'], startDate: in3Days, dueDate: in14Days, estimatedHours: 40, actualHours: null, progress: 0, repeatRule: 'none', dependsOn: 'task-1', archived: false, orderIndex: 1, createdAt: subDays(now, 7).toISOString(), updatedAt: now.toISOString() },
        { id: 'task-2a', projectId: 'proj-1', parentId: 'task-2', title: 'Component yapısını kur', description: 'Atomic design ile component mimarisi', status: 'todo', priority: 'high', tags: ['İş'], startDate: null, dueDate: in7Days, estimatedHours: 8, actualHours: null, progress: 0, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 0, createdAt: subDays(now, 7).toISOString(), updatedAt: now.toISOString() },
        { id: 'task-2b', projectId: 'proj-1', parentId: 'task-2', title: 'Responsive tasarım uygula', description: 'Mobile-first yaklaşım', status: 'todo', priority: 'medium', tags: ['İş'], startDate: null, dueDate: in14Days, estimatedHours: 12, actualHours: null, progress: 0, repeatRule: 'none', dependsOn: 'task-2a', archived: false, orderIndex: 1, createdAt: subDays(now, 7).toISOString(), updatedAt: now.toISOString() },

        // Kişisel Gelişim
        { id: 'task-3', projectId: 'proj-2', parentId: null, title: 'İngilizce Öğrenme', description: 'B2 seviyesine ulaş', status: 'in-progress', priority: 'medium', tags: ['Kişisel', 'Okul'], startDate: subMonths(now, 1).toISOString().split('T')[0], dueDate: in30Days, estimatedHours: 60, actualHours: 25, progress: 40, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 0, createdAt: subMonths(now, 1).toISOString(), updatedAt: now.toISOString() },
        { id: 'task-3a', projectId: 'proj-2', parentId: 'task-3', title: 'Günlük 30 dk okuma', description: 'İngilizce makale/kitap oku', status: 'in-progress', priority: 'medium', tags: ['Kişisel'], startDate: null, dueDate: null, estimatedHours: null, actualHours: null, progress: 50, repeatRule: 'daily', dependsOn: null, archived: false, orderIndex: 0, createdAt: subMonths(now, 1).toISOString(), updatedAt: now.toISOString() },
        { id: 'task-3b', projectId: 'proj-2', parentId: 'task-3', title: 'Haftalık konuşma pratiği', description: 'Online konuşma dersi', status: 'in-progress', priority: 'medium', tags: ['Kişisel'], startDate: null, dueDate: null, estimatedHours: null, actualHours: null, progress: 30, repeatRule: 'weekly', dependsOn: null, archived: false, orderIndex: 1, createdAt: subMonths(now, 1).toISOString(), updatedAt: now.toISOString() },

        { id: 'task-4', projectId: 'proj-2', parentId: null, title: 'Spor Programı', description: 'Haftada 4 gün egzersiz', status: 'in-progress', priority: 'high', tags: ['Sağlık', 'Spor'], startDate: subDays(now, 14).toISOString().split('T')[0], dueDate: null, estimatedHours: null, actualHours: null, progress: 70, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 1, createdAt: subDays(now, 14).toISOString(), updatedAt: now.toISOString() },

        // Bugünkü görevler
        { id: 'task-5', projectId: null, parentId: null, title: 'Market alışverişi', description: 'Haftalık market listesi', status: 'todo', priority: 'medium', tags: ['Ev', 'Alışveriş'], startDate: today, dueDate: today, estimatedHours: 1, actualHours: null, progress: 0, repeatRule: 'weekly', dependsOn: null, archived: false, orderIndex: 0, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'task-6', projectId: null, parentId: null, title: 'Fatura ödemeleri', description: 'Elektrik ve internet faturası', status: 'todo', priority: 'high', tags: ['Ev'], startDate: null, dueDate: tomorrow, estimatedHours: 0.5, actualHours: null, progress: 0, repeatRule: 'monthly', dependsOn: null, archived: false, orderIndex: 1, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'task-7', projectId: 'proj-3', parentId: null, title: 'Mutfak tezgahı seçimi', description: 'Granit vs mermer karşılaştır', status: 'waiting', priority: 'medium', tags: ['Ev'], startDate: ago3Days, dueDate: in7Days, estimatedHours: 3, actualHours: 1, progress: 30, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 0, createdAt: subDays(now, 5).toISOString(), updatedAt: now.toISOString() },

        // Gecikmiş görev
        { id: 'task-8', projectId: null, parentId: null, title: 'Diş hekimi randevusu al', description: '6 aylık kontrol', status: 'todo', priority: 'high', tags: ['Sağlık'], startDate: null, dueDate: yesterday, estimatedHours: 0.5, actualHours: null, progress: 0, repeatRule: 'none', dependsOn: null, archived: false, orderIndex: 2, createdAt: subDays(now, 10).toISOString(), updatedAt: now.toISOString() },
    ];

    // === TRANSACTIONS (Son 3 ay) ===
    const transactions: Transaction[] = [];
    const months = [0, 1, 2];

    for (const m of months) {
        const monthDate = subMonths(now, m);
        const mStr = (d: number) => format(subDays(monthDate, d), 'yyyy-MM-dd');

        // Gelirler
        transactions.push(
            { id: `tr-income-${m}-1`, date: mStr(25), type: 'income', category: 'Maaş', amount: 18000, note: 'Aylık maaş', paymentMethod: 'transfer', repeatRule: 'monthly', createdAt: now.toISOString() },
            { id: `tr-income-${m}-2`, date: mStr(15), type: 'income', category: 'Freelance', amount: 3500 + m * 500, note: 'Web geliştirme projesi', paymentMethod: 'transfer', repeatRule: 'none', createdAt: now.toISOString() },
        );

        // Giderler
        transactions.push(
            { id: `tr-exp-${m}-1`, date: mStr(1), type: 'expense', category: 'Kira', amount: 7500, note: 'Ev kirası', paymentMethod: 'transfer', repeatRule: 'monthly', createdAt: now.toISOString() },
            { id: `tr-exp-${m}-2`, date: mStr(5), type: 'expense', category: 'Market', amount: 2800 + m * 200, note: 'Haftalık market', paymentMethod: 'card', repeatRule: 'none', createdAt: now.toISOString() },
            { id: `tr-exp-${m}-3`, date: mStr(8), type: 'expense', category: 'Ulaşım', amount: 850, note: 'Akbil + benzin', paymentMethod: 'card', repeatRule: 'monthly', createdAt: now.toISOString() },
            { id: `tr-exp-${m}-4`, date: mStr(12), type: 'expense', category: 'Faturalar', amount: 1200 + m * 100, note: 'Elektrik, su, internet', paymentMethod: 'transfer', repeatRule: 'monthly', createdAt: now.toISOString() },
            { id: `tr-exp-${m}-5`, date: mStr(18), type: 'expense', category: 'Eğlence', amount: 600 + m * 150, note: 'Sinema, yemek, cafe', paymentMethod: 'card', repeatRule: 'none', createdAt: now.toISOString() },
            { id: `tr-exp-${m}-6`, date: mStr(22), type: 'expense', category: 'Abonelikler', amount: 350, note: 'Netflix, Spotify, iCloud', paymentMethod: 'card', repeatRule: 'monthly', createdAt: now.toISOString() },
        );

        if (m === 0) {
            transactions.push(
                { id: `tr-exp-${m}-7`, date: mStr(3), type: 'expense', category: 'Giyim', amount: 1500, note: 'Kış kıyafetleri', paymentMethod: 'card', repeatRule: 'none', createdAt: now.toISOString() },
                { id: `tr-exp-${m}-8`, date: mStr(10), type: 'expense', category: 'Sağlık', amount: 450, note: 'Eczane', paymentMethod: 'cash', repeatRule: 'none', createdAt: now.toISOString() },
            );
        }
    }

    const goals: Goal[] = [
        { id: 'goal-1', name: 'MacBook Pro', targetAmount: 85000, currentSaved: 32000, targetDate: format(addDays(now, 180), 'yyyy-MM-dd'), monthlyPlanAmount: 10000, priority: 'high', createdAt: subMonths(now, 3).toISOString(), updatedAt: now.toISOString() },
        { id: 'goal-2', name: 'Tatil Fonu', targetAmount: 25000, currentSaved: 8500, targetDate: format(addDays(now, 120), 'yyyy-MM-dd'), monthlyPlanAmount: 5000, priority: 'medium', createdAt: subMonths(now, 2).toISOString(), updatedAt: now.toISOString() },
        { id: 'goal-3', name: 'Acil Durum Fonu', targetAmount: 50000, currentSaved: 21000, targetDate: null, monthlyPlanAmount: 3000, priority: 'high', createdAt: subMonths(now, 6).toISOString(), updatedAt: now.toISOString() },
    ];

    const goalTransactions: GoalTransaction[] = [
        { id: 'gt-1', goalId: 'goal-1', amount: 10000, type: 'deposit', date: subMonths(now, 2).toISOString().split('T')[0], note: 'İlk birikim' },
        { id: 'gt-2', goalId: 'goal-1', amount: 12000, type: 'deposit', date: subMonths(now, 1).toISOString().split('T')[0], note: 'Freelance geliri' },
        { id: 'gt-3', goalId: 'goal-1', amount: 10000, type: 'deposit', date: subDays(now, 5).toISOString().split('T')[0], note: 'Aylık plan' },
        { id: 'gt-4', goalId: 'goal-2', amount: 5000, type: 'deposit', date: subMonths(now, 1).toISOString().split('T')[0], note: 'Tatil birikimleri' },
        { id: 'gt-5', goalId: 'goal-2', amount: 3500, type: 'deposit', date: subDays(now, 10).toISOString().split('T')[0], note: 'Ek birikim' },
    ];

    const notes: Note[] = [
        { id: 'note-1', title: 'Toplantı Notları', content: 'Pazartesi günü saat 14:00\'da proje toplantısı yapılacak.\n\n• Tasarım güncellemelerini sun\n• Backend API durumunu gözden geçir\n• Sprint planlama yap', tags: ['İş'], importance: 'high', pinned: true, createdAt: subDays(now, 2).toISOString(), updatedAt: now.toISOString() },
        { id: 'note-2', title: 'Alışveriş Listesi', content: '• Süt\n• Ekmek\n• Yumurta\n• Peynir\n• Domates\n• Salatalık\n• Tavuk göğsü', tags: ['Kişisel', 'Ev'], importance: 'low', pinned: false, createdAt: subDays(now, 1).toISOString(), updatedAt: now.toISOString() },
        { id: 'note-3', title: 'Kitap Önerileri', content: '1. Atomic Habits - James Clear\n2. Deep Work - Cal Newport\n3. The Pragmatic Programmer\n4. Clean Code - Robert Martin', tags: ['Kişisel', 'Okul'], importance: 'medium', pinned: true, createdAt: subDays(now, 5).toISOString(), updatedAt: now.toISOString() },
        { id: 'note-4', title: 'Proje Fikirleri', content: 'Mobil uygulama fikirleri:\n\n1. Sağlıklı beslenme takibi\n2. Spor antrenman planı\n3. Meditasyon ve mindfulness', tags: ['İş', 'Hobi'], importance: 'medium', pinned: false, createdAt: subDays(now, 8).toISOString(), updatedAt: now.toISOString() },
        { id: 'note-5', title: 'Şifreler ve Hesaplar', content: 'Önemli hesap bilgileri burada güvenle saklanacak.\n\nNot: Gerçek şifreleri buraya yazmayın, şifre yöneticisi kullanın!', tags: ['Kişisel'], importance: 'high', pinned: true, createdAt: subDays(now, 15).toISOString(), updatedAt: now.toISOString() },
    ];

    const reminders: Reminder[] = [
        { id: 'rem-1', title: 'Proje toplantısı', datetime: `${tomorrow}T14:00:00`, repeatRule: 'weekly', linkedType: null, linkedId: null, completed: false, createdAt: now.toISOString() },
        { id: 'rem-2', title: 'İlaç al', datetime: `${today}T09:00:00`, repeatRule: 'daily', linkedType: null, linkedId: null, completed: false, createdAt: now.toISOString() },
        { id: 'rem-3', title: 'Kira ödemesi', datetime: `${in3Days}T10:00:00`, repeatRule: 'monthly', linkedType: null, linkedId: null, completed: false, createdAt: now.toISOString() },
        { id: 'rem-4', title: 'Spor salonu', datetime: `${tomorrow}T18:00:00`, repeatRule: 'none', linkedType: 'task', linkedId: 'task-4', completed: false, createdAt: now.toISOString() },
    ];

    return { projects, tasks, transactions, goals, goalTransactions, notes, reminders };
}
