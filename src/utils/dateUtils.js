import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * ISO 문자열 날짜를 포매팅하여 반환합니다.
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @param {string} formatStr - 포맷팅 패턴 (기본값: 'yyyy-MM-dd HH:mm')
 * @param {Object} options - 추가 옵션
 * @returns {string} 포매팅된 날짜 문자열
 */
export const formatDate = (dateString, formatStr = 'yyyy-MM-dd HH:mm', options = {}) => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' 
      ? parseISO(dateString) 
      : dateString;
    
    return format(date, formatStr, {
      locale: ko,
      ...options
    });
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return dateString;
  }
};

/**
 * 날짜를 한국어 형식으로 포매팅합니다.
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} 한국어로 포매팅된 날짜 문자열 (예: 2023년 10월 15일)
 */
export const formatKoreanDate = (dateString) => {
  if (!dateString) return '';
  
  return formatDate(dateString, 'yyyy년 MM월 dd일');
};

/**
 * 시간을 한국어 형식으로 포매팅합니다.
 * @param {string} timeString - 시간 문자열 (HH:mm 형식)
 * @returns {string} 한국어로 포매팅된 시간 문자열 (예: 오후 2시 30분)
 */
export const formatKoreanTime = (timeString) => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const ampm = hours < 12 ? '오전' : '오후';
  const hour = hours % 12 || 12;
  
  return `${ampm} ${hour}시${minutes > 0 ? ` ${minutes}분` : ''}`;
};

/**
 * 날짜와 시간을 함께 한국어 형식으로 포매팅합니다.
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @param {string} timeString - 시간 문자열 (HH:mm 형식)
 * @returns {string} 한국어로 포매팅된 날짜와 시간 문자열 (예: 2023년 10월 15일 오후 2시 30분)
 */
export const formatKoreanDateTime = (dateString, timeString) => {
  if (!dateString) return '';
  
  const date = formatKoreanDate(dateString);
  const time = timeString ? formatKoreanTime(timeString) : '';
  
  return time ? `${date} ${time}` : date;
};

/**
 * 기간을 포매팅합니다. (같은 날짜인 경우 날짜 중복 제거)
 * @param {string} startDate - 시작 날짜 (ISO 형식)
 * @param {string} endDate - 종료 날짜 (ISO 형식)
 * @param {string} startTime - 시작 시간 (HH:mm 형식) - 선택적
 * @param {string} endTime - 종료 시간 (HH:mm 형식) - 선택적
 * @returns {string} 포매팅된 기간 문자열
 */
export const formatDateRange = (startDate, endDate, startTime, endTime) => {
  if (!startDate) return '';
  
  const start = formatKoreanDate(startDate);
  const end = formatKoreanDate(endDate);
  
  let result = '';
  
  // 같은 날짜인 경우
  if (start === end) {
    result = start;
    
    // 시작 시간과 종료 시간이 모두 있는 경우
    if (startTime && endTime) {
      result += ` ${formatKoreanTime(startTime)} ~ ${formatKoreanTime(endTime)}`;
    }
    // 시작 시간만 있는 경우
    else if (startTime) {
      result += ` ${formatKoreanTime(startTime)}`;
    }
  }
  // 다른 날짜인 경우
  else {
    result = `${start}`;
    
    if (startTime) {
      result += ` ${formatKoreanTime(startTime)}`;
    }
    
    result += ` ~ ${end}`;
    
    if (endTime) {
      result += ` ${formatKoreanTime(endTime)}`;
    }
  }
  
  return result;
};

/**
 * 현재 날짜가 해당 기간 내에 있는지 확인합니다.
 * @param {string} startDate - 시작 날짜 (ISO 형식)
 * @param {string} endDate - 종료 날짜 (ISO 형식)
 * @returns {boolean} 현재 날짜가 기간 내에 있으면 true
 */
export const isCurrentDateInRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // 시간 제거 (날짜만 비교)
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);
  
  return now >= start && now <= end;
};
