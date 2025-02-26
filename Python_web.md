# 웹 스크래핑 기초 (Python + BeautifulSoup)

## 필수 라이브러리 설치
```bash
pip install requests
pip install bs4
```

## 라이브러리 임포트
```python
import requests
from bs4 import BeautifulSoup
```

## 웹사이트 접속 및 데이터 가져오기
```python
x_data = requests.get('URL')
print(x_data)  # 전체 데이터 출력

# 응답 상태 코드 확인 (정상: 200, 오류: 400/500 등)
print(x_data.status_code)

# HTML 원본 가져오기 (.content: 바이너리 데이터, .text: 문자열 데이터)
html_content = x_data.content
html_text = x_data.text
print(html_text)  # HTML 문서를 문자열로 출력

# HTML 파싱
soup = BeautifulSoup(x_data.content, 'html.parser')
print(soup)  # 인코딩 문제 해결
```

## HTML 속에서 원하는 데이터 추출하기
### `find_all()`을 사용하여 특정 태그 찾기
```python
print(soup.find_all('태그명', 속성명)[0].text)
```
- 결과는 리스트 형태 (`[]`)로 반환되므로 인덱싱 필요
- `.text`를 사용하면 HTML 태그 없이 순수 텍스트만 가져올 수 있음

### `select()`를 사용하여 class 또는 id로 찾기
```python
리스트 = soup.select('.className')  # class는 `.`, id는 `#` 사용
print(리스트[0].text)  # 첫 번째 요소의 텍스트 출력
print(리스트[1]['href'])  # 링크 주소 출력
```
- 특정 태그 내에서 찾을 때: `tag.className`
- 하위 요소를 찾을 때: `soup.select('.className className2')` # 공백은 하위 요소로의 진입

> **[!NOTE]**  
> 크롬 개발자 도구에서 원하는 데이터를 찾을 때 참고하세요.[^1]

## 이미지 수집하기 <img>
```python
이미지 = soup.select('#ididid')[0]
print(이미지['src'])
```
- 이미지 저장하기:
```python
import urllib.request
urllib.request.urlretrieve(이미지['src'], '파일명.jpg')
```

## 여러 페이지에서 데이터 수집하기
- URL 패턴이 일정하면 `f'문자열{변수}문자열'`을 사용하여 자동화 가능

## 무한 스크롤 페이지 데이터 수집
1. 개발자 도구 → Network 탭 → `request URL` 확인
2. 해당 URL을 `requests.get()`으로 요청하여 추가 데이터 가져오기
```python
requests.get('request URL')
```

## 특수 문자 정리 (`\` 제거)
```python
soup = BeautifulSoup(x_data.text.replace('\\', ''), 'html.parser')
```
- 문자만 사용가능하므로 text로 해야함

## URL에서 Query 분석
- URL의 `query`는 검색어를 의미함
```python
import urllib.parse
parsed_url = urllib.parse.urlparse('URL')
print(parsed_url.query)
```
      ---

[^1]: - HTML의 태그에 기록된 이름을 주시할 것  
      - 속성명은 보통 `id` (유니크함)  
      - `class` (중복 가능)로 찾을 때는 예약어이므로 `class_`로 사용해야 오류 방지  
      - `class`가 띄어쓰기로 여러 개 있을 경우, 하나만 사용해도 됨 
      - 글자가 해체되어 있는 경우 상위 `class`사용

