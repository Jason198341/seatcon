import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { formatKoreanDate, formatKoreanTime, isCurrentDateInRange } from '../utils/dateUtils';

/**
 * 홈 페이지 컴포넌트
 */
const HomePage = () => {
  // 현재 진행 중인 컨퍼런스 날짜 (2025-05-10 ~ 2025-05-12)
  const conferenceStartDate = '2025-05-10';
  const conferenceEndDate = '2025-05-12';
  const isConferenceActive = isCurrentDateInRange(conferenceStartDate, conferenceEndDate);

  // 다음 세션 데이터 (실제로는 API에서 가져와야 함)
  const nextSession = {
    title: '차세대 코어 메커니즘 개발 소개',
    presenter: '진우재',
    company: '대원정밀공업',
    time: '09:00',
    date: '2025-05-10',
    location: '메인 컨퍼런스홀'
  };

  // 주요 전시물 데이터 (실제로는 API에서 가져와야 함)
  const featuredExhibits = [
    {
      id: 1,
      title: '차세대 코어 메커니즘 개발',
      company: '대원정밀공업',
      displayMethod: '판넬 / 샘플'
    },
    {
      id: 13,
      title: '개인특화 엔터테인먼트 시트',
      company: '디에스시동탄',
      displayMethod: '샘플'
    },
    {
      id: 16,
      title: '통풍 시트',
      company: 'AEW',
      displayMethod: '시트 1석'
    },
    {
      id: 21,
      title: 'Lear ComfortMaxR & Core Mechanism',
      company: '리어코리아',
      displayMethod: '전시 테이블 (2개)'
    }
  ];

  return (
    <MainLayout>
      <div className="bg-gray-50">
        {/* 히어로 섹션 */}
        <div className="bg-indigo-600 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">2025 시트 기술 컨퍼런스</h1>
            <p className="text-xl mb-6">미래 모빌리티를 위한 시트 기술의 혁신</p>
            <p className="text-lg mb-8">
              {formatKoreanDate(conferenceStartDate)} ~ {formatKoreanDate(conferenceEndDate)}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/exhibits"
                className="bg-white text-indigo-600 px-6 py-3 rounded-md font-medium hover:bg-indigo-50 transition"
              >
                전시물 둘러보기
              </Link>
              <Link
                to="/presentations"
                className="bg-indigo-500 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-400 transition"
              >
                발표 일정 확인
              </Link>
            </div>
          </div>
        </div>

        {/* 컨퍼런스 상태 */}
        <div className="container mx-auto px-4 py-8">
          {isConferenceActive ? (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r mb-8">
              <div className="flex items-center">
                <div className="py-1">
                  <svg
                    className="h-6 w-6 text-green-500 mr-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">컨퍼런스가 현재 진행 중입니다!</p>
                  <p className="text-sm">
                    {formatKoreanDate(conferenceStartDate)} ~ {formatKoreanDate(conferenceEndDate)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r mb-8">
              <div className="flex items-center">
                <div className="py-1">
                  <svg
                    className="h-6 w-6 text-blue-500 mr-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">곧 시작하는 컨퍼런스</p>
                  <p className="text-sm">
                    {formatKoreanDate(conferenceStartDate)} ~ {formatKoreanDate(conferenceEndDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 다음 세션 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">다음 세션</h2>
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="text-lg font-medium mb-2">{nextSession.title}</h3>
                <p className="text-gray-600 mb-1">
                  {nextSession.presenter} ({nextSession.company})
                </p>
                <p className="text-gray-600 mb-1">
                  {formatKoreanDate(nextSession.date)} {formatKoreanTime(nextSession.time)}
                </p>
                <p className="text-gray-600">{nextSession.location}</p>
                <Link
                  to="/presentations"
                  className="inline-block mt-4 text-indigo-600 hover:text-indigo-800"
                >
                  전체 일정 보기 &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">빠른 링크</h2>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/exhibits"
                    className="flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    전시물 목록
                  </Link>
                </li>
                <li>
                  <Link
                    to="/presentations"
                    className="flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                    발표 일정
                  </Link>
                </li>
                <li>
                  <Link
                    to="/schedules"
                    className="flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    컨퍼런스 일정
                  </Link>
                </li>
                <li>
                  <Link
                    to="/chat"
                    className="flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    채팅방
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 주요 전시물 */}
          <h2 className="text-2xl font-bold mb-6">주요 전시물</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredExhibits.map((exhibit) => (
              <Link
                key={exhibit.id}
                to={`/exhibits/${exhibit.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {exhibit.title}
                  </h3>
                  <p className="text-blue-600 font-medium mb-2">{exhibit.company}</p>
                  <p className="text-sm text-gray-500">{exhibit.displayMethod}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* 컨퍼런스 소개 */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-12">
            <h2 className="text-2xl font-bold mb-4">컨퍼런스 소개</h2>
            <p className="text-gray-600 mb-4">
              2025 시트 기술 컨퍼런스는 자동차 시트 분야의 최신 기술과 혁신을 공유하는 자리입니다. 
              협력사, 연구소, 해외 파트너들이 모여 미래 모빌리티를 위한 시트 기술의 발전 방향을 모색합니다.
            </p>
            <p className="text-gray-600 mb-4">
              다양한 전시물과 발표 세션을 통해 차세대 코어 메커니즘, 안락성 향상 기술, 
              경량화 및 친환경 솔루션 등 시트 산업의 최신 트렌드를 경험할 수 있습니다.
            </p>
            <p className="text-gray-600">
              참가자들은 다양한 채팅방을 통해 실시간으로 소통하며, 언어 장벽 없이 다국어 번역 지원으로 
              글로벌 협력을 강화할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;
