# .env.local 파일에 아래 내용 붙여넣기 하셔야합니다.
# 카카오 크롤링 인증정보 
# YOUR_PASSWORD="카톡 비밀번호"
# YOUR_KAKAO_ID_OR_PHONE="카톡 id"


# 특정 가구 카테고리만 크롤링
# tables_category_index 로 조작
# -2  = 가구 , -1 = 선택된 가구(장바구니)
# 0= chairs , 1= Lighting
# 2= Storage , 3 = Tables
# 4 = Decor , 5 = Bathroom
# 6 = Kitchen , 7 = Appliances
# 8 = Sofas, 9 = Construction
# 10 = Bedroom , 11 = Outdoor
# 12 = Home Decor

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
import pandas as pd
import time
from sqlalchemy import create_engine
import traceback
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env.local')

KAKAO_ID = os.getenv('YOUR_KAKAO_ID_OR_PHONE')
KAKAO_PW = os.getenv('YOUR_PASSWORD')

# 환경 변수가 제대로 로드되었는지 확인
if not KAKAO_ID or not KAKAO_PW:
    print("오류: .env.local 파일에서 카카오 아이디 또는 비밀번호를 찾을 수 없습니다.")
    print("파일 경로와 내용을 다시 확인해주세요.")
    exit()

# --- 1. 웹 드라이버 설정 및 사이트 접속 ---
print("Archisketch 사이트로 이동합니다.")
chrome_options = webdriver.ChromeOptions()
driver = webdriver.Chrome(options=chrome_options)
driver.get('https://planner.archisketch.com/')
time.sleep(3) # 페이지 로딩 대기

# --- 2. 카카오 로그인 ---
try:
    print("카카오 로그인을 시도합니다.")
    # 카카오 로그인 버튼 클릭
    driver.find_element(By.CSS_SELECTOR, "#__next > div.sc-76e1595e-0.eUXodR > div > div.sc-890624c3-4.gymmcL > div > div.sc-9b38d526-0.imPflw > button.sc-40db095e-0.hVzojL.sign-in-kakao-btn > img").click()
    time.sleep(1)

    # 아이디 입력
    element = driver.find_element(By.XPATH, '//*[@id="loginId--1"]')
    element.send_keys(os.getenv('YOUR_KAKAO_ID_OR_PHONE'))

    # 비밀번호 입력
    element = driver.find_element(By.XPATH, '//*[@id="password--2"]')
    element.send_keys(os.getenv('YOUR_PASSWORD'))
    time.sleep(0.5)

    # Log in 버튼 클릭
    driver.find_element(By.CSS_SELECTOR, '#mainContent > div > div > form > div.confirm_btn > button.btn_g.highlight.submit').click()
    print("로그인 성공. 메인 페이지로 이동합니다.")
    time.sleep(20) # 로그인 후 페이지 로딩 대기
except Exception as e:
    print(f"로그인 과정에서 오류가 발생했습니다: {e}")
    driver.quit() # 오류 발생 시 드라이버 종료
    exit() # 스크립트 종료

# --- 3. 가구 라이브러리 페이지로 이동 ---
try:
    print("가구 라이브러리 페이지로 이동을 시작합니다.")
    # Continue 버튼 (있을 경우)
    try:
        driver.find_element(By.XPATH, '//*[@id="mArticle"]/div/div[2]/form/button').click()
        time.sleep(1)
    except:
        print("'Continue' 버튼이 없어 건너뜁니다.")

    # 튜토리얼 닫기 (있을 경우)
    try:
        driver.find_element(By.XPATH, '//*[@id="__next"]/main/section[1]/div[2]').click()
        time.sleep(10) # 튜토리얼 로딩 및 사라지는 시간 대기
    except:
        print("튜토리얼 팝업이 없어 건너뜁니다.")

    # CREATE A NEW PROJECT 버튼
    driver.find_element(By.XPATH, '//*[@id="ContentBlock"]/main/div/section[1]/div[3]/button[1]').click()
    time.sleep(5)

    # Go to the Floor Plan Editor
    driver.find_element(By.XPATH, '//*[@id="ContentBlock"]/main/div[2]/div/div[2]/div[1]/div[2]/section/div[2]/div[2]').click()
    time.sleep(3)

    # Empty plan
    driver.find_element(By.XPATH, '//*[@id="root"]/main[2]/section[2]/section[1]/div[1]/div[2]').click()
    time.sleep(2)

    # 가구 메뉴 버튼 클릭
    driver.find_element(By.XPATH, '//*[@id="root"]/section/div[1]/nav/button[6]').click()
    print("가구 라이브러리 페이지에 도착했습니다.")
    time.sleep(1)
except Exception as e:
    print(f"페이지 이동 중 오류가 발생했습니다: {e}")
    driver.quit()
    exit()

# --- 4. 가구 데이터 수집 (크롤링) ---
result = []
# 각 카테고리 ID 
furnitures_category = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

print("가구 데이터 수집을 시작합니다.")
######################################################
# 원하는 가구 카테고리 번호를 여기서 지정하시면 됩니다.
# 0 = chairs , 1 = Lighting
# 2 = Storage , 3 = Tables
# 4 = Decor , 5 = Bathroom
# 6 = Kitchen , 7 = Appliances
# 8 = Sofas, 9 = Construction
# 10 = Bedroom , 11 = Outdoor
# 12 = Home Decor
tables_category_index = 5
######################################################

# 특정 카테고리만 순회
for z in [tables_category_index]:
    try:
        print(f"카테고리 {z+1}/{len(furnitures_category)} 수집 중...")
        # z번째 카테고리 클릭
        driver.find_element(By.XPATH, f'//*[@id="root"]/section/div[1]/div[1]/div/section/aside/div/section/div[{z+1}]').click()
        time.sleep(1) # 카테고리 내 가구 로딩 대기


        # 필요시 스크롤 다운
        # from selenium.webdriver.support.ui import WebDriverWait
        # from selenium.webdriver.support import expected_conditions as EC
        # 스크롤 대상 요소 대기 & 획득
        # scroll_container = WebDriverWait(driver, 10).until(
        #     EC.presence_of_element_located((
        #         By.XPATH,
        #         # aside 패널 ↓ 내부의 리스트 컨테이너 ↓ 그 안의 overflow:auto div
        #         "//aside[contains(@class,'AsidePanel__Panel')]"
        #         "//section[contains(@class,'LibraryItemList2__Container')]"
        #         "//div[contains(@style,'overflow') and contains(@style,'auto')]"
        #     ))
        # )

        # 이 예제에서는 각 카테고리별로 일부만 가져오도록 범위를 작게 설정 (필요시 range 수정)
        for i in range(1, 11): # 행 (10행까지)
            for j in range(1, 3): # 열 (2열까지)
                try:
                    # 가구 아이템 클릭
                    item_xpath = f'//*[@id="root"]/section/div[1]/div[1]/div/section/aside/section/div/div[3]/div[{i}]/div[{j}]/div/div[1]/div[3]'
                    driver.find_element(By.XPATH, item_xpath).click()
                    time.sleep(0.5)
                    
                    # 이미지 src 가져오기
                    img_element = driver.find_element(By.XPATH, '//*[@id="root"]/div[5]/section[1]/img')
                    img_src = img_element.get_attribute('src')
                    
                    # 팝업 정보 가져오기
                    popup_info = driver.find_element(By.XPATH, '//*[@id="root"]/div[5]/div')
                    info_data = popup_info.text.split('\n')
                    
                    # 정보 파싱 - 팝업 텍스트 구조 파악
                    name = info_data[0] if len(info_data) > 0 else ''
                    brand = ''
                    dimensions = ''
                    
                    # 치수 정보 찾기 (W:숫자 x D:숫자 x H:숫자 패턴)
                    for line in info_data[1:]:  # 첫 번째 줄(이름) 제외
                        if 'x' in line and ('W:' in line or 'D:' in line or 'H:' in line):
                            dimensions = line
                        elif not dimensions and line.strip():  # 치수가 아닌 첫 번째 텍스트를 브랜드로
                            brand = line
                    
                    w, h, d = None, None, None
                    if 'x' in dimensions:
                        # "W:535 x D:612 x H:1660 (mm)" 형태에서 치수 추출
                        parts = dimensions.replace('(mm)', '').replace('mm', '').split('x')
                        if len(parts) == 3:
                            try:
                                for part in parts:
                                    part = part.strip()
                                    if 'W:' in part:
                                        w = int(part.split(':')[1].strip())
                                    elif 'D:' in part:
                                        d = int(part.split(':')[1].strip())  
                                    elif 'H:' in part:
                                        h = int(part.split(':')[1].strip())
                            except (ValueError, IndexError):
                                w, h, d = None, None, None
                    
                    # NOT NULL 제약조건 때문에 0으로 설정 (치수 없는 경우)
                    if w is None: w = 0
                    if h is None: h = 0  
                    if d is None: d = 0
                    
                    result.append({
                        'name': name,
                        'description': None,
                        'length_x': w,
                        'length_y': h,
                        'length_z': d,
                        'image_url': img_src,
                        'model_url': None,
                        'price': None,
                        'brand': brand,
                        'is_active': False,
                        'category_id': furnitures_category[z],
                    })
                    
                    # 팝업 닫기 (ESC 키)
                    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                except Exception as e:
                    # print(f'  - 가구 아이템 (행:{i}, 열:{j})을 찾을 수 없거나 처리 중 오류 발생.')
                    continue # 해당 아이템을 찾을 수 없으면 다음으로 넘어감
    except Exception as e:
        print(f'카테고리 {z} 처리 중 오류: {e}')
        continue

# 크롤링이 끝나면 드라이버 종료
driver.quit()

# --- 5. 수집된 데이터 확인 및 데이터베이스에 저장 ---
# 수집한 데이터를 DataFrame으로 변환
df = pd.DataFrame(result)
print(f'총 {len(df)}개 가구 수집 완료.')

# 데이터베이스에 연결하기 전, 수집된 데이터가 있는지 확인
if not df.empty:
    try:
        # --- 데이터베이스 연결 설정 ---
        db_config = {
            'host': 'wheretoput-db.chwouasus83g.ap-northeast-2.rds.amazonaws.com',
            'database': 'wheretoput_db',
            'user': 'wheretoput_admin',
            'password': 'trustyourdata',
            'port': '5432'
        }
        engine = create_engine(
            f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
        )

        # 1. 데이터베이스에서 기존 가구 이름들을 모두 가져오기
        print("데이터베이스에서 기존 가구 목록을 조회합니다...")
        try:
            existing_furnitures_df = pd.read_sql_query('SELECT name FROM furniture.furnitures', engine)
            existing_names = set(existing_furnitures_df['name'])
            print(f"기존 가구 {len(existing_names)}개를 확인했습니다.")
        except Exception:
            # 테이블이 없는 최초 실행일 경우, 빈 set으로 시작
            existing_names = set()
            print("기존 'furnitures' 테이블이 없어, 모든 수집 데이터를 신규로 처리합니다.")

        # 2. 수집한 데이터(df)에서 기존 이름에 없는 새로운 가구만 필터링
        new_furnitures_df = df[~df['name'].isin(existing_names)]

        # 3. 새로운 가구가 있을 경우에만 데이터베이스에 삽입
        if not new_furnitures_df.empty:
            print(f'신규 가구 {len(new_furnitures_df)}개를 데이터베이스에 추가합니다.')
            
            # 추가되는 가구 이름들을 로그로 출력
            print("추가되는 가구 목록:")
            for idx, name in enumerate(new_furnitures_df['name'], 1):
                print(f"  {idx}. {name}")
            
            new_furnitures_df.to_sql(
                'furnitures', 
                engine, 
                if_exists='append', 
                index=False, 
                schema='furniture'
            )
            print('PostgreSQL에 새로운 데이터 삽입 완료!')
        else:
            print('추가할 새로운 가구가 없습니다.')

    except Exception as e:
        print("데이터베이스 작업 중 오류가 발생했습니다.")
        print(traceback.format_exc()) # 자세한 오류 내용 출력
else:
    print("수집된 가구가 없어 데이터베이스 작업을 건너뜁니다.")

print("모든 작업을 마쳤습니다.")