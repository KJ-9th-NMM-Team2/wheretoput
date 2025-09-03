from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import pandas as pd
import time
from sqlalchemy import create_engine, text
import traceback
import urllib.parse
import re
import random
# 현재 실제 쇼핑몰 크롤링은 안됩니다! 
# 랜덤 가격 생성시 첫 세자리는 반올림됩니다.
# 카테고리별 랜덤가격 범위:
# -2  = 가구 , -1 = 선택된 가구(장바구니)
# 0= chairs(의자): 50,000원 ~ 300,000원
# 1= Lighting(조명): 30,000원 ~ 200,000원
# 2= Storage(수납): 100,000원 ~ 400,000원
# 3= Tables(식탁): 150,000원 ~ 500,000원
# 4= Decor(장식): 20,000원 ~ 150,000원
# 5= Bathroom(욕실): 50,000원 ~ 300,000원
# 6= Kitchen(주방): 100,000원 ~ 600,000원
# 7= Appliances(가전): 200,000원 ~ 1,000,000원
# 8= Sofas(소파): 200,000원 ~ 800,000원
# 9= Construction(건설): 50,000원 ~ 500,000원
# 10= Bedroom(침실): 300,000원 ~ 1,000,000원
# 11= Outdoor(야외): 100,000원 ~ 400,000원
# 12= Home Decor(홈데코): 30,000원 ~ 200,000원


class FurniturePriceCrawler:
    def __init__(self):
        self.db_config = {
            'host': 'wheretoput-db.chwouasus83g.ap-northeast-2.rds.amazonaws.com',
            'database': 'wheretoput_db',
            'user': 'wheretoput_admin',
            'password': 'trustyourdata',
            'port': '5432'
        }
        self.engine = create_engine(
            f"postgresql://{self.db_config['user']}:{self.db_config['password']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
        )
        
    def optimize_search_query(self, furniture_name):
        """검색어 최적화 - 불필요한 단어 제거 및 핵심 키워드 추출"""
        # 제거할 단어들 (괄호 내용, 색상, 상태 등)
        remove_patterns = [
            r'\([^)]*\)',  # 괄호와 괄호 내용
            r'그레이|화이트|블랙|브라운|베이지',  # 색상
            r'펼친상태|접힌상태|완성품',  # 상태
            r'cm|mm|\d+x\d+',  # 크기 정보
        ]
        
        optimized_query = furniture_name
        for pattern in remove_patterns:
            optimized_query = re.sub(pattern, '', optimized_query)
        
        # 연속된 공백 제거 및 앞뒤 공백 제거
        optimized_query = re.sub(r'\s+', ' ', optimized_query).strip()
        
        # 핵심 키워드만 추출 (첫 1-2 단어)
        words = optimized_query.split()
        if len(words) > 2:
            optimized_query = ' '.join(words[:2])
        
        return optimized_query
        
    def setup_driver(self):
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument('--headless')  # 백그라운드 실행
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        return webdriver.Chrome(options=chrome_options)

    def search_naver_shopping_price(self, furniture_name):
        """네이버 쇼핑에서 가구 가격 검색"""
        try:
            driver = self.setup_driver()
            
            # 네이버 쇼핑 검색 URL
            search_query = urllib.parse.quote(furniture_name)
            url = f"https://shopping.naver.com/search/all?query={search_query}"
            
            driver.get(url)
            time.sleep(3)
            
            # 여러 가격 셀렉터 시도
            price_selectors = [
                ".price_num__S2p_v",
                ".price",
                ".price_area .price",
                "[class*='price']",
                ".product_price",
                ".basicList_price__k_wSV"
            ]
            
            for selector in price_selectors:
                try:
                    price_elements = WebDriverWait(driver, 5).until(
                        EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
                    )
                    if price_elements:
                        price_text = price_elements[0].text
                        # 숫자만 추출 (최소 3자리 숫자)
                        price_match = re.search(r'(\d{3,})', price_text.replace(',', ''))
                        if price_match:
                            return int(price_match.group(1))
                except TimeoutException:
                    continue
                
            driver.quit()
            return None
            
        except Exception as e:
            print(f"네이버 쇼핑 가격 검색 오류 ({furniture_name}): {e}")
            try:
                driver.quit()
            except:
                pass
            return None

    def search_coupang_price(self, furniture_name):
        """쿠팡에서 가구 가격 검색"""
        try:
            driver = self.setup_driver()
            
            # 쿠팡 검색 URL
            search_query = urllib.parse.quote(furniture_name)
            url = f"https://www.coupang.com/np/search?q={search_query}"
            
            driver.get(url)
            time.sleep(3)
            
            # 여러 가격 셀렉터 시도
            price_selectors = [
                ".price-value",
                ".sale-price",
                ".discount-price",
                "[class*='price']",
                ".prod-price .price-value"
            ]
            
            for selector in price_selectors:
                try:
                    price_element = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    price_text = price_element.text
                    # 숫자만 추출 (최소 3자리 숫자)
                    price_match = re.search(r'(\d{3,})', price_text.replace(',', ''))
                    if price_match:
                        return int(price_match.group(1))
                except TimeoutException:
                    continue
                
            driver.quit()
            return None
            
        except Exception as e:
            print(f"쿠팡 가격 검색 오류 ({furniture_name}): {e}")
            try:
                driver.quit()
            except:
                pass
            return None

    def search_gmarket_price(self, furniture_name):
        """G마켓에서 가구 가격 검색"""
        try:
            driver = self.setup_driver()
            
            # G마켓 검색 URL
            search_query = urllib.parse.quote(furniture_name)
            url = f"http://browse.gmarket.co.kr/search?keyword={search_query}"
            
            driver.get(url)
            time.sleep(2)
            
            # 첫 번째 상품의 가격 찾기
            try:
                price_element = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".s-price strong"))
                )
                price_text = price_element.text
                # 숫자만 추출
                price = re.sub(r'[^\d]', '', price_text)
                if price:
                    return int(price)
            except TimeoutException:
                pass
                
            driver.quit()
            return None
            
        except Exception as e:
            print(f"G마켓 가격 검색 오류 ({furniture_name}): {e}")
            try:
                driver.quit()
            except:
                pass
            return None

    def search_11st_price(self, furniture_name):
        """11번가에서 가구 가격 검색"""
        try:
            driver = self.setup_driver()
            
            # 11번가 검색 URL
            search_query = urllib.parse.quote(furniture_name)
            url = f"https://search.11st.co.kr/Search.tmall?method=getTotalSearchSeller&isGnb=Y&kwd={search_query}"
            
            driver.get(url)
            time.sleep(2)
            
            # 첫 번째 상품의 가격 찾기
            try:
                price_element = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".sale_price"))
                )
                price_text = price_element.text
                # 숫자만 추출
                price = re.sub(r'[^\d]', '', price_text)
                if price:
                    return int(price)
            except TimeoutException:
                pass
                
            driver.quit()
            return None
            
        except Exception as e:
            print(f"11번가 가격 검색 오류 ({furniture_name}): {e}")
            try:
                driver.quit()
            except:
                pass
            return None

    def get_furniture_price(self, furniture_name):
        """여러 쇼핑몰에서 가격 검색하여 평균가 또는 최저가 반환"""
        # 검색어 최적화
        optimized_name = self.optimize_search_query(furniture_name)
        print(f"'{furniture_name}' -> '{optimized_name}' 가격 검색 중...")
        
        prices = []
        
        # 네이버 쇼핑에서 검색 (우선 순위 높음)
        naver_price = self.search_naver_shopping_price(optimized_name)
        if naver_price:
            prices.append(naver_price)
            print(f"  - 네이버 쇼핑: {naver_price:,}원")
        
        # 딜레이 추가 (과도한 요청 방지)
        time.sleep(random.uniform(2, 4))
        
        # 쿠팡에서 검색
        coupang_price = self.search_coupang_price(optimized_name)
        if coupang_price:
            prices.append(coupang_price)
            print(f"  - 쿠팡: {coupang_price:,}원")
        
        # 딜레이 추가
        time.sleep(random.uniform(2, 4))
        
        # G마켓에서 검색
        gmarket_price = self.search_gmarket_price(optimized_name)
        if gmarket_price:
            prices.append(gmarket_price)
            print(f"  - G마켓: {gmarket_price:,}원")
        
        if prices:
            # 최저가 반환 (또는 평균가를 원할 경우 sum(prices) // len(prices))
            min_price = min(prices)
            print(f"  -> 최저가: {min_price:,}원")
            return min_price
        else:
            print(f"  -> 가격 정보를 찾을 수 없습니다.")
            return None

    def set_random_prices(self):
        """가격이 null인 가구들에게 랜덤 가격 설정"""
        try:
            # 가격이 null인 가구들 조회
            query = """
            SELECT furniture_id, name 
            FROM furniture.furnitures 
            WHERE price IS NULL 
            ORDER BY furniture_id
            """
            
            furnitures_df = pd.read_sql_query(query, self.engine)
            
            if furnitures_df.empty:
                print("가격 설정이 필요한 가구가 없습니다.")
                return
            
            print(f"총 {len(furnitures_df)}개 가구에 랜덤 가격을 설정합니다.")
            
            updated_count = 0
            
            for index, row in furnitures_df.iterrows():
                furniture_id = row['furniture_id']
                furniture_name = row['name']
                
                # 가구 종류에 따른 랜덤 가격 범위 설정 (천원 단위로 반올림)
                if any(keyword in furniture_name.lower() for keyword in ['소파', 'sofa']):
                    random_price = random.randint(200, 800) * 1000  # 20만원~80만원
                elif any(keyword in furniture_name.lower() for keyword in ['침대', 'bed']):
                    random_price = random.randint(300, 1000) * 1000  # 30만원~100만원
                elif any(keyword in furniture_name.lower() for keyword in ['식탁', 'table', '테이블']):
                    random_price = random.randint(150, 500) * 1000  # 15만원~50만원
                elif any(keyword in furniture_name.lower() for keyword in ['의자', 'chair']):
                    random_price = random.randint(50, 300) * 1000  # 5만원~30만원
                elif any(keyword in furniture_name.lower() for keyword in ['책상', 'desk']):
                    random_price = random.randint(100, 400) * 1000  # 10만원~40만원
                elif any(keyword in furniture_name.lower() for keyword in ['조명', 'light', 'lamp']):
                    random_price = random.randint(30, 200) * 1000  # 3만원~20만원
                else:
                    # 기본 가격 범위
                    random_price = random.randint(50, 300) * 1000  # 5만원~30만원
                
                # 데이터베이스 업데이트
                update_query = f"""
                UPDATE furniture.furnitures 
                SET price = {random_price} 
                WHERE furniture_id = '{furniture_id}'
                """
                
                try:
                    with self.engine.connect() as connection:
                        connection.execute(text(update_query))
                        connection.commit()
                    updated_count += 1
                    print(f"  ✓ ID {furniture_id}: {furniture_name} -> {random_price:,}원 설정 완료")
                except Exception as e:
                    print(f"  ✗ ID {furniture_id} 업데이트 실패: {e}")
                
                # 진행률 표시
                progress = ((index + 1) / len(furnitures_df)) * 100
                print(f"진행률: {progress:.1f}% ({index + 1}/{len(furnitures_df)})")
            
            print(f"\n랜덤 가격 설정 완료: {updated_count}/{len(furnitures_df)}개 성공")
            
        except Exception as e:
            print(f"랜덤 가격 설정 중 오류 발생: {e}")
            print(traceback.format_exc())

    def update_furniture_prices(self):
        """데이터베이스에서 가격이 null인 가구들의 가격 업데이트"""
        try:
            # 가격이 null인 가구들 조회
            query = """
            SELECT furniture_id, name 
            FROM furniture.furnitures 
            WHERE price IS NULL 
            ORDER BY furniture_id
            """
            
            furnitures_df = pd.read_sql_query(query, self.engine)
            
            if furnitures_df.empty:
                print("가격 업데이트가 필요한 가구가 없습니다.")
                return
            
            print(f"총 {len(furnitures_df)}개 가구의 가격을 업데이트합니다.")
            
            updated_count = 0
            
            for index, row in furnitures_df.iterrows():
                furniture_id = row['furniture_id']
                furniture_name = row['name']
                
                # 가격 검색
                price = self.get_furniture_price(furniture_name)
                
                if price:
                    # 데이터베이스 업데이트
                    update_query = f"""
                    UPDATE furniture.furnitures 
                    SET price = {price} 
                    WHERE id = {furniture_id}
                    """
                    
                    try:
                        with self.engine.connect() as connection:
                            connection.execute(text(update_query))
                            connection.commit()
                        updated_count += 1
                        print(f"  ✓ ID {furniture_id}: {furniture_name} -> {price:,}원 업데이트 완료")
                    except Exception as e:
                        print(f"  ✗ ID {furniture_id} 업데이트 실패: {e}")
                else:
                    print(f"  - ID {furniture_id}: {furniture_name} -> 가격 정보 없음")
                
                # 진행률 표시
                progress = ((index + 1) / len(furnitures_df)) * 100
                print(f"진행률: {progress:.1f}% ({index + 1}/{len(furnitures_df)})")
                
                # 과도한 요청 방지를 위한 딜레이
                time.sleep(random.uniform(5, 8))
            
            print(f"\n가격 업데이트 완료: {updated_count}/{len(furnitures_df)}개 성공")
            
        except Exception as e:
            print(f"가격 업데이트 중 오류 발생: {e}")
            print(traceback.format_exc())

def main():
    """메인 함수"""
    crawler = FurniturePriceCrawler()
    
    # 사용 방법 선택
    print("가격 설정 방법을 선택하세요:")
    print("1. 실제 쇼핑몰에서 크롤링 (시간 오래 걸림)")
    print("2. 랜덤 가격으로 설정 (빠름)")
    
    choice = input("선택하세요 (1 또는 2): ").strip()
    
    if choice == "1":
        crawler.update_furniture_prices()
    elif choice == "2":
        crawler.set_random_prices()
    else:
        print("잘못된 선택입니다. 1 또는 2를 입력해주세요.")

if __name__ == "__main__":
    main()