import { View, Text, ScrollView, TouchableOpacity, StatusBar, StyleSheet, Linking, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, Calendar, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebView } from 'react-native-webview';
import { Modal } from 'react-native';
import PaperLogo from '../../../components/PaperLogo';
import { store } from '../../../utils/store';
import { IMAGES } from '../../../assets/images';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STEP_LABELS = ['Plan', 'Schedule', 'Review', 'Payment'];

export default function SubscribeScreen() {
  const { subscription_id } = useLocalSearchParams<{ subscription_id: string }>();
  const [papers, setPapers] = useState(store.getPapers());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setPapers(store.getPapers());
    });
    return unsubscribe;
  }, []);

  const paper = papers.find(p => p.id === subscription_id) || papers[0] || {
    id: '1',
    name: 'Publication',
    language: 'English',
    category: 'Paper' as const,
    priceDay: 5,
    priceMonth: 150,
    rating: 4.5,
    src: IMAGES.vijayavani,
  };

  // Generate dynamic plans based on actual paper prices
  const PLANS = [
    paper.priceDay > 0
      ? { id: 'daily', label: 'Daily', price: paper.priceDay, unit: '/day', badge: null as string | null }
      : null,
    { id: 'monthly', label: 'Monthly', price: paper.priceMonth, unit: '/month', badge: paper.priceDay > 0 ? 'Popular' as const : null },
    { id: 'yearly', label: 'Yearly', price: Math.round(paper.priceMonth * 10), unit: '/year', badge: 'Save 17%' as const, savings: Math.round(paper.priceMonth * 2) },
  ].filter(Boolean) as Array<{ id: string; label: string; price: number; unit: string; badge: string | null; savings?: number }>;

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>(PLANS.find(p => p.id === 'monthly') ? 'monthly' : PLANS[0]?.id || 'monthly');
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [skippedDates, setSkippedDates] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [showFeeNote, setShowFeeNote] = useState(false);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const removeSkipDate = (dateStr: string) => {
    setSkippedDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const selectedPlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[0];
  const planLabel = selectedPlanObj?.label ?? 'Monthly';
  const planPrice = selectedPlanObj?.price ?? paper.priceMonth;

  const monthlyPrice =
    selectedPlan === 'monthly' ? paper.priceMonth
      : selectedPlan === 'yearly' ? Math.round(paper.priceMonth * 10 / 12)
        : paper.priceDay * selectedDays.length * 4;

  const goNext = () => {
    if (step === 3) {
      const user = store.getUser();
      if (!user) {
        router.push('/customer/login');
        return;
      }
      
      // Open the Razorpay WebView Modal
      setShowRazorpay(true);
    } else if (step === 2) {
      setStep(3);
      setShowFeeNote(true);
    } else if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setShowRazorpay(false);
    const user = store.getUser();
    
    store.addSubscription({
      paperName: paper.name,
      plan: planLabel,
      priceDay: paper.priceDay,
      priceMonth: paper.priceMonth,
      startDate: startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      days: selectedDays,
      imageSource: paper.src,
      paymentMethod: paymentMethod, 
    });

    const message = `*New ${paper.category} Subscription!* ${paper.category === 'Paper' ? '📰' : '📚'}

*Customer:* ${user?.name || 'Customer'}
*Phone:* ${user?.phone || 'N/A'}
*Address:* ${user?.address || 'Koramangala'}
*Publication:* ${paper.name} (${paper.language})
*Plan:* ${planLabel} • ₹${planPrice}${selectedPlanObj?.unit || ''}
*Days:* ${selectedDays.join(', ')}
*Start Date:* ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
*Fee Paid:* ₹50 (Razorpay ID: ${paymentId})

_Sent via PaperFresh App_`;

    const adminPhone = '919972505709';
    const url = `https://api.whatsapp.com/send?phone=${adminPhone}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch((err) => {
      console.warn('Could not launch WhatsApp:', err);
    });

    setStep(step + 1);
  };

  const razorpayHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body style="background-color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <h3 style="font-family: sans-serif; color: #64748B;">Loading Payment Gateway...</h3>
        <script>
          var options = {
            "key": "rzp_test_SuVuCcW1RgCWJ2",
            "amount": "5000",
            "currency": "INR",
            "name": "PaperFresh Delivery",
            "description": "One-time Order Fee",
            "image": "https://i.imgur.com/3g7nmJC.png",
            "handler": function (response){
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', paymentId: response.razorpay_payment_id }));
            },
            "prefill": {
                "name": "${store.getUser()?.name || 'Customer'}",
                "email": "test@example.com",
                "contact": "${store.getUser()?.phone || '9999999999'}"
            },
            "theme": {
                "color": "#2563EB"
            }
          };
          var rzp1 = new Razorpay(options);
          rzp1.on('payment.failed', function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'failed', error: response.error.description }));
          });
          rzp1.open();
        </script>
      </body>
    </html>
  `;

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Subscribe</Text>
          <Text style={styles.headerSub}>{paper.name}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Mini paper banner under header */}
      <View style={[
        styles.miniBanner,
        { backgroundColor: paper.category === 'Paper' ? '#EFF6FF' : '#FAF5FF' }
      ]}>
        <View style={styles.miniBannerImg}>
          {paper.src ? (
            <Image source={paper.src} style={{ width: 48, height: 48 }} resizeMode="contain" />
          ) : (
            <PaperLogo name={paper.name} id={paper.id} size="sm" />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.miniBannerName}>{paper.name}</Text>
          <Text style={{
            fontSize: 11,
            color: paper.category === 'Paper' ? '#2563EB' : '#9333EA',
            fontWeight: '700'
          }}>{paper.language} • {paper.category}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {paper.priceDay > 0 && (
            <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>₹{paper.priceDay}/day</Text>
          )}
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>₹{paper.priceMonth}/mo</Text>
        </View>
      </View>

      {/* Step Progress Bar */}
      {step < 4 && (
        <View style={styles.stepBar}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const done = num < step;
            const active = num === step;
            return (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={[
                      styles.stepCircle,
                      (done || active) && styles.stepCircleActive,
                    ]}
                  >
                    {done ? (
                      <Check size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.stepNum, active && styles.stepNumActive]}>{num}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabelText, active && styles.stepLabelTextActive]}>{label}</Text>
                </View>
                {i < STEP_LABELS.length - 1 && (
                  <View style={[styles.stepLine, num < step && styles.stepLineActive]} />
                )}
              </View>
            );
          })}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>

          {/* ── STEP 1: CHOOSE PLAN ────────────────── */}
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Choose Plan</Text>

              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={[styles.planCard, isSelected && styles.planCardActive]}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.planLabel}>{plan.label}</Text>
                          {plan.badge && (
                            <View style={[styles.planBadge, plan.badge === 'Popular' ? styles.badgePopular : styles.badgeSave]}>
                              <Text style={[styles.badgeText, plan.badge === 'Popular' ? styles.badgeTextPopular : styles.badgeTextSave]}>
                                {plan.badge}
                              </Text>
                            </View>
                          )}
                        </View>
                        {'savings' in plan && plan.savings && (
                          <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '600', marginTop: 2 }}>Save ₹{plan.savings}/year</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.planPrice}>
                      ₹{plan.price}<Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>{plan.unit}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Start Date */}
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateInput} activeOpacity={0.7} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateText}>{startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <Calendar size={18} color="#2563EB" />
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onStartDateChange}
                />
              )}

              {/* End Date */}
              <Text style={styles.inputLabel}>End Date (Optional)</Text>
              <TouchableOpacity style={styles.dateInput} activeOpacity={0.7} onPress={() => setShowEndPicker(true)}>
                <Text style={{ fontSize: 14, color: endDate ? '#0F172A' : '#94A3B8', fontWeight: '500' }}>
                  {endDate ? endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select end date'}
                </Text>
                <Calendar size={18} color={endDate ? "#2563EB" : "#94A3B8"} />
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={startDate}
                  onChange={onEndDateChange}
                />
              )}

              {/* Summary Bar */}
              <View style={styles.monthlySummaryBar}>
                <Text style={{ fontSize: 14, color: '#475569', fontWeight: '600' }}>{planLabel} Plan</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>₹{planPrice}</Text>
                  {selectedPlanObj?.savings && (
                    <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600' }}>Save ₹{selectedPlanObj.savings}</Text>
                  )}
                </View>
              </View>
            </>
          )}

          {/* ── STEP 2: DELIVERY DAYS ───────────────── */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Delivery Days</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16, fontWeight: '500' }}>
                {paper.category === 'Magazine'
                  ? 'Select your preferred delivery days'
                  : 'Select days you want delivery'}
              </Text>

              {ALL_DAYS.map((day) => {
                const checked = selectedDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[styles.dayCard, checked && styles.dayCardChecked]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Check size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.dayText, checked && styles.dayTextChecked]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={[
                styles.monthlySummaryBar,
                { marginTop: 16 }
              ]}>
                <Text style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>
                  {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} per week
                </Text>
                <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '800' }}>
                  {selectedDays.length === 7 ? 'Everyday' : selectedDays.map(d => d.slice(0, 3)).join(', ')}
                </Text>
              </View>
            </>
          )}

          {/* ── STEP 3: REVIEW & PAY ────────────────────────────── */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Review & Place Order</Text>

              {/* Subscription Details Table */}
              <View style={styles.reviewCard}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 14 }}>
                  {paper.category} Details
                </Text>

                {[
                  { label: paper.category, value: `${paper.name} (${paper.language})` },
                  { label: 'Plan', value: `${planLabel} • ₹${planPrice}${selectedPlanObj?.unit || ''}` },
                  { label: 'Start Date', value: startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  {
                    label: 'Delivery Days',
                    value: selectedDays.length === 7 ? 'Everyday'
                      : selectedDays.length === 0 ? 'None'
                        : selectedDays.map(d => d.substring(0, 3)).join(', ')
                  },
                  { label: 'Monthly Cost', value: `₹${monthlyPrice} (Collected by Vendor)` },
                ].map((row) => (
                  <View key={row.label} style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>{row.label}</Text>
                    <View style={{ flex: 1, paddingLeft: 16 }}>
                      <Text style={styles.reviewValue}>{row.value}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>One-time Order Fee</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#2563EB' }}>₹50</Text>
                </View>
              </View>

              {/* Payment Method */}
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 }}>Pay Order Fee (₹50)</Text>
              {['UPI'].map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={[styles.payCard, isSelected && styles.payCardSelected]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#2563EB' : '#334155' }}>{method}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── STEP 4: SUCCESS ─────── */}
          {step === 4 && (
            <View style={{ alignItems: 'center', paddingTop: 20 }}>
              <View style={styles.successCircle}>
                <CheckCircle size={64} color="#16A34A" />
              </View>
              <Text style={styles.successTitle}>Subscription Activated!</Text>
              <Text style={styles.successSub}>
                Your subscription to {paper.name} has been successfully activated.
              </Text>

              {/* Next Delivery Card */}
              <View style={styles.nextDeliveryCard}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>NEXT DELIVERY</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#16A34A', marginTop: 4 }}>Tomorrow</Text>
              </View>

              <TouchableOpacity
                style={styles.viewSubBtn}
                onPress={() => router.replace('/customer/bottom_nav/papers')}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>View Subscription</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/customer/bottom_nav/home')} activeOpacity={0.7} style={{ marginTop: 14 }}>
                <Text style={{ color: '#2563EB', fontSize: 14, fontWeight: '700' }}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action CTA */}
      {step < 4 && (
        <View style={styles.bottomCtaBar}>
          <TouchableOpacity
            style={[
              styles.nextBtn,
              step === 3 && (paper.category === 'Magazine' ? { backgroundColor: '#9333EA' } : { backgroundColor: '#EA580C' })
            ]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {step === 3 ? `Pay ₹50` : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fee Explanation Modal */}
      <Modal transparent={true} visible={showFeeNote} animationType="fade" onRequestClose={() => setShowFeeNote(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }}>
            <View style={{ backgroundColor: '#EFF6FF', padding: 24, borderBottomWidth: 1, borderBottomColor: '#DBEAFE', alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>ℹ️</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E40AF', textAlign: 'center' }}>Important Note</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E40AF', textAlign: 'center', marginTop: 4 }}>ಪ್ರಮುಖ ಸೂಚನೆ</Text>
            </View>
            <View style={{ padding: 24 }}>
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22, textAlign: 'center', marginBottom: 16 }}>
                The <Text style={{ fontWeight: '800', color: '#2563EB' }}>₹50 fee</Text> is a one-time booking charge to schedule your daily delivery. The actual monthly subscription cost will be collected directly by your vendor.
              </Text>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22, textAlign: 'center', fontStyle: 'italic', marginBottom: 24 }}>
                ನಿಮ್ಮ ದೈನಂದಿನ ವಿತರಣೆಯನ್ನು ನಿಗದಿಪಡಿಸಲು <Text style={{ fontWeight: '800', color: '#2563EB' }}>₹50 ಶುಲ್ಕವು</Text> ಒಂದು ಬಾರಿಯ ಬುಕಿಂಗ್ ಶುಲ್ಕವಾಗಿದೆ. ಮಾಸಿಕ ಚಂದಾದಾರಿಕೆ ವೆಚ್ಚವನ್ನು ನಿಮ್ಮ ವಿತರಕರು ನೇರವಾಗಿ ಸಂಗ್ರಹಿಸುತ್ತಾರೆ.
              </Text>
              
              <TouchableOpacity 
                style={{ backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setShowFeeNote(false)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>I Understand / ಸರಿ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Razorpay WebView Modal */}
      <Modal visible={showRazorpay} animationType="slide" onRequestClose={() => setShowRazorpay(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }}>
             <TouchableOpacity onPress={() => setShowRazorpay(false)} style={{ padding: 4 }}>
               <X size={20} color="#0F172A" />
             </TouchableOpacity>
             <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', marginRight: 24 }}>Secure Payment</Text>
          </View>
          <WebView 
            source={{ html: razorpayHtml }} 
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.status === 'success') {
                  handlePaymentSuccess(data.paymentId);
                } else if (data.status === 'failed') {
                  setShowRazorpay(false);
                  alert(`Payment failed: ${data.error || 'User cancelled'}`);
                }
              } catch (e) {
                console.error(e);
              }
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  miniBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  miniBannerImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  miniBannerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepNumActive: {
    color: '#FFFFFF',
  },
  stepLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  stepLabelTextActive: {
    color: '#2563EB',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 14,
  },
  stepLineActive: {
    backgroundColor: '#2563EB',
  },

  stepTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 16,
  },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  planCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  planLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePopular: {
    backgroundColor: '#2563EB',
  },
  badgeSave: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextPopular: {
    color: '#FFFFFF',
  },
  badgeTextSave: {
    color: '#D97706',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  monthlySummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  dayCardChecked: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  dayTextChecked: {
    color: '#2563EB',
    fontWeight: '800',
  },

  skipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },

  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 4,
  },

  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  payCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  nextDeliveryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  viewSubBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },

  bottomCtaBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  nextBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
