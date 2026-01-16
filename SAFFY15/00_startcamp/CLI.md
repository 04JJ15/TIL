# CLI 기초 가이드 (Git Bash용)

간단명료하게 CLI(Command Line Interface)가 무엇인지와, Windows에서 `Git Bash`를 설치해 사용했을 때 자주 쓰이는 기본 명령어들을 예시와 함께 정리한 문서입니다.

---

## 1. CLI란?
CLI는 텍스트 명령어를 입력해 컴퓨터를 조작하는 인터페이스입니다. GUI와 달리 키보드로 빠르게 작업을 자동화하거나 스크립트를 실행할 때 유용합니다.

## 2. Git Bash란?
Windows에서 유닉스 계열 쉘(Bash) 명령을 사용할 수 있게 해주는 도구입니다. Git을 설치하면 함께 설치되는 경우가 많아 Git 명령과 일반 쉘 명령을 모두 사용할 수 있습니다.

---

## 3. 기본 명령어 모음
아래 명령어들은 `Git Bash`에서 바로 사용할 수 있습니다.

- 파일/디렉터리 확인

```
pwd           # 현재 작업 디렉터리 출력
ls -la        # 디렉터리 목록 (숨김파일 포함, 자세히)
cd 폴더명     # 디렉터리 이동
```

- 파일/디렉터리 생성과 삭제

```
mkdir 새폴더         # 디렉터리 생성
touch 파일.txt       # 빈 파일 생성
rm 파일.txt          # 파일 삭제
rm -r 폴더명         # 디렉터리(하위 포함) 삭제
```

- 파일 복사/이동

```
cp 원본 대상        # 파일 복사
mv 원본 대상        # 파일 이동/이름 변경
```

- 파일 내용 확인

```
cat 파일.txt         # 파일 전체 출력
less 파일.txt        # 페이지 단위로 보기 (방향키로 이동, q로 종료)
head -n 10 파일.txt  # 처음 10줄
tail -n 10 파일.txt  # 마지막 10줄
```

- 파일 내용 생성/추가(리다이렉션)

```
echo "안녕" > hello.txt    # 파일 덮어쓰기
echo "추가" >> hello.txt   # 파일 끝에 추가
```

- 파이프와 필터

```
cat 파일.txt | grep "검색어"   # 파일에서 검색어 포함 라인만 출력
ls -la | grep ".js$"           # 확장자가 .js인 파일만 필터
```

- 유용한 기타

```
history      # 이전에 입력한 명령 목록
clear        # 화면 지우기
```

---

## 4. Git 기초 명령 (Git Bash에서 자주 사용)

```
git init                 # 새 Git 저장소 초기화
git clone <url>          # 원격 저장소 복제
git status               # 변경 상태 확인
git add 파일또는.        # 스테이징
git commit -m "메시지"   # 커밋
git log                  # 커밋 로그
git branch               # 브랜치 목록
git checkout 브랜치명     # 브랜치 전환
git pull                 # 원격에서 최신 가져오기
git push                 # 로컬 커밋을 원격으로 업로드
```

---

## 5. 예제: 간단한 작업 흐름

1) 디렉터리 만들고 이동

```
mkdir myproject
cd myproject
```

2) 파일 만들고 내용 작성

```
echo "print('Hello')" > main.py
cat main.py
```

3) Git 초기화 후 커밋

```
git init
git add .
git commit -m "Initial commit"
```

---

## 6. 팁
- 명령어와 옵션은 대소문자를 구분합니다. 주의해서 입력하세요.
- 모르는 명령어는 `명령어 --help` 또는 `man 명령어`로 도움말을 확인하세요(`man`은 기본적으로 설치되지 않을 수 있음).
- Windows에서 파일 경로는 백슬래시(\)가 기본이지만, Git Bash에서는 슬래시(/)를 사용해도 동작합니다.

더 추가하고 싶은 명령어나, 연습용 미니 과제를 넣어드릴까요? 예: 파일 찾기 연습, 간단한 쉘 스크립트 만들기 등.
