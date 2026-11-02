import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  XCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { store } from '../../../utils/store';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const [user, setUser] = useState(store.getUser());
  const [deliveries, setDeliveries] = useState(store.getDeliveries());

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [marks, setMarks] = useState(store.getCalendarMarks());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setUser(store.getUser());
      setDeliveries(store.getDeliveries());
      setMarks(store.getCalendarMarks());
    });
    return unsub;
  }, []);

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const userSubs = deliveries.filter((d) => d.name === user?.name && d.plan !== 'One-time');
  const primarySub = userSubs[0] || deliveries[0];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const getDayStatus = (dayNum: number) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${dayNum}`;
    if (marks[dateKey]) return marks[dateKey];

    const isToday =
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      dayNum === today.getDate();

    if (isToday) return primarySub?.status || 'Pending';
    return 'Scheduled';
  };

  const toggleMarkDelivered = (dayNum: number) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${dayNum}`;
    store.setCalendarMark(dateKey, 'Delivered');
  };

  const toggleMarkNotDelivered = (dayNum: number) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${dayNum}`;
    store.setCalendarMark(dateKey, 'Not Delivered');
  };

  const selectedStatus = getDayStatus(selectedDay);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
        <View style={styles.blueTopHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', flex: 1, textAlign: 'center', marginRight: 36 }}>
            Calendar
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <CalendarIcon size={48} color="#94A3B8" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' }}>
            Calendar Access
          </Text>
          <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
            Log in to view your daily delivery schedule and track past orders.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2563EB', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 }}
            onPress={() => router.push('/customer/login')}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Log In / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* ── RICH BLUE TOP HEADER ── */}
      <View style={styles.blueTopHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Delivery Calendar</Text>
          <Text style={styles.headerSub}>Track daily newspapers</Text>
        </View>

        <TouchableOpacity style={styles.todayBtn} onPress={handleJumpToToday} activeOpacity={0.8}>
          <CalendarIcon size={14} color="#2563EB" />
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* ── LIGHT BODY CONTAINER (NO BLUE AT BOTTOM) ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollBody}
      >
        {/* ── CLEAN MONTHLY CALENDAR CARD ── */}
        <View style={styles.calendarCard}>
            {/* Month Navigator Header */}
            <View style={styles.monthHeader}>
              <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth} activeOpacity={0.7}>
                <ChevronLeft size={18} color="#334155" />
              </TouchableOpacity>

              <Text style={styles.monthTitleText}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>

              <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth} activeOpacity={0.7}>
                <ChevronRight size={18} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Weekday Row Header */}
            <View style={styles.weekdayRow}>
              {DAY_NAMES.map((d, index) => (
                <Text key={index} style={styles.weekdayText}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayTileEmpty} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const status = getDayStatus(dayNum);
                const isSelected = selectedDay === dayNum;
                const isToday =
                  currentYear === today.getFullYear() &&
                  currentMonth === today.getMonth() &&
                  dayNum === today.getDate();

                let isMarked = false;
                let bgColor = 'transparent';
                let textColor = '#0F172A';
                
                if (status === 'Delivered') {
                  bgColor = '#22C55E';
                  textColor = '#FFFFFF';
                  isMarked = true;
                } else if (status === 'Not Delivered') {
                  bgColor = '#EF4444';
                  textColor = '#FFFFFF';
                  isMarked = true;
                }

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayTile,
                      isMarked && { backgroundColor: bgColor },
                      !isMarked && isSelected && styles.dayTileSelected,
                      isToday && !isSelected && !isMarked && styles.dayTileToday,
                      isSelected && isMarked && { borderWidth: 2, borderColor: '#0F172A' },
                    ]}
                    onPress={() => setSelectedDay(dayNum)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayNumText,
                        isMarked && { color: textColor, fontWeight: '800' },
                        !isMarked && isSelected && styles.dayNumTextSelected,
                        isToday && !isSelected && !isMarked && styles.dayNumTextToday,
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {!isMarked && (
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isSelected ? '#FFFFFF' : '#3B82F6' },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend Bar */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                <Text style={styles.legendText}>Delivered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                <Text style={styles.legendText}>Not Delivered</Text>
              </View>
            </View>
          </View>

          {/* ── SELECTED DAY DETAIL & ACTIONS ── */}
          <View style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedDateTitle}>
                  {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
                </Text>
                <Text style={styles.paperSubName}>
                  Paper: <Text style={{ color: '#2563EB', fontWeight: '800' }}>{primarySub?.paperName || 'Vijayavani'}</Text>
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  selectedStatus === 'Delivered' && { backgroundColor: '#DCFCE7' },
                  selectedStatus === 'Not Delivered' && { backgroundColor: '#FEE2E2' },
                  (selectedStatus === 'Scheduled' || selectedStatus === 'Pending') && { backgroundColor: '#EFF6FF' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    selectedStatus === 'Delivered' && { color: '#15803D' },
                    selectedStatus === 'Not Delivered' && { color: '#B91C1C' },
                    (selectedStatus === 'Scheduled' || selectedStatus === 'Pending') && { color: '#1E40AF' },
                  ]}
                >
                  {selectedStatus}
                </Text>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  selectedStatus === 'Delivered' ? { backgroundColor: '#16A34A' } : { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
                ]}
                onPress={() => toggleMarkDelivered(selectedDay)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14 }}>✅</Text>
                <Text
                  style={[
                    styles.actionBtnText,
                    selectedStatus === 'Delivered' ? styles.textWhite : { color: '#16A34A' },
                  ]}
                >
                  Mark Delivered
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  selectedStatus === 'Not Delivered' ? styles.actionBtnActiveRed : styles.actionBtnOutlineRed,
                ]}
                onPress={() => toggleMarkNotDelivered(selectedDay)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14 }}>❌</Text>
                <Text
                  style={[
                    styles.actionBtnText,
                    selectedStatus === 'Not Delivered' ? styles.textWhite : { color: '#DC2626' },
                  ]}
                >
                  Not Delivered
                </Text>
              </TouchableOpacity>
            </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2563EB',
  },

  /* Blue Top Header */
  blueTopHeader: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
    fontWeight: '500',
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 17,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  /* Light Body Content */
  scrollBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
  },

  /* Calendar Card */
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayTileEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayTile: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
    marginVertical: 1,
  },
  dayTileSelected: {
    backgroundColor: '#2563EB',
  },
  dayTileToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayNumTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayNumTextToday: {
    color: '#2563EB',
    fontWeight: '900',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },

  /* Legend */
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Selected Day Actions */
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  selectedDateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  paperSubName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 9,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 39,
    borderRadius: 11,
  },
  actionBtnOutlineRed: {
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  actionBtnActiveRed: {
    backgroundColor: '#DC2626',
  },
  actionBtnOutlineYellow: {
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    backgroundColor: '#FFFBEB',
  },
  actionBtnActiveYellow: {
    backgroundColor: '#D97706',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textWhite: {
    color: '#FFFFFF',
  },
});
