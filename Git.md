# Git 기본 사용법 정리

## 1. Git 초기화 및 설정
### Git 초기화
- 작업 폴더를 코드 작성기에 불러온 후, 터미널에서 아래 명령어를 입력합니다:
  ```bash
  git init
  ```
  - 새로운 Git 저장소(repository)를 생성합니다.

### 파일 작업 후 상태 기록
- 파일의 현재 상태를 기록하거나 수정 후 저장한 내용을 기록하려면:
  ```bash
  git add <filename1> <filename2>
  git commit -m "message"
  ```
- **`git add`와 `git commit`이 분리된 이유**:
  - 반복해서 저장할 필요가 없는 파일은 선택적으로 스테이징(staging)하도록 설계되었습니다.

### Git의 3가지 영역
- **작업 폴더(Working Directory)**
- **스테이징 영역(Staging Area)**
- **저장소(Repository)**

#### 주요 명령어
- 모든 파일을 스테이징:
  ```bash
  git add .
  ```
- 현재 상태 확인:
  ```bash
  git status
  ```
- 커밋 내역 조회:
  ```bash
  git log --all --oneline --graph
  ```
- 커밋 전 변경 내용 비교:
  ```bash
  git diff
  ```
- 특정 커밋과 비교:
  ```bash
  git difftool <commit_id>
  ```

---

## 2. 브랜치 관리
### 브랜치 생성 및 전환
- 브랜치 생성:
  ```bash
  git branch <branchname>
  ```
- 브랜치 전환:
  ```bash
  git switch <branchname>
  ```
- 브랜치 이름을 `main`으로 설정:
  ```bash
  git branch -M main
  ```

### 브랜치 병합
- 병합하기 전에 기준 브랜치로 전환:
  ```bash
  git switch <main_branch>
  ```
- 병합 명령어:
  ```bash
  git merge <branchname>
  ```
- 병합 완료 후 브랜치 삭제:
  ```bash
  git branch -d <branchname>
  ```
- 병합하지 않은 브랜치를 강제로 삭제:
  ```bash
  git branch -D <branchname>
  ```

### 병합 방법
1. **3-way merge**: 기준 브랜치와 합칠 브랜치 모두 신규 커밋이 있는 경우.
2. **fast-forward merge**: 기준 브랜치에 신규 커밋이 없을 경우.
3. **rebase and merge**: 브랜치 시작점을 기준 브랜치의 신규 커밋 지점으로 옮겨 병합.
   ```bash
   git rebase <main_branch>
   git merge <branchname>
   ```
4. **squash and merge**: 여러 커밋을 하나로 합쳐 깔끔한 로그 유지.
   ```bash
   git merge --squash <branchname>
   ```

---

## 3. 파일 및 커밋 복구
### 파일 복구
- 최근 커밋 상태로 복구:
  ```bash
  git restore <filename>
  ```
- 특정 커밋 상태로 복구:
  ```bash
  git restore --source <commit_id> <filename>
  ```
- 스테이징 취소:
  ```bash
  git restore --staged <filename>
  ```

### 커밋 취소
- 이전 커밋을 수정한 커밋 생성:
  ```bash
  git revert <commit_id>
  ```

### 과거로 되돌리기
- **Soft Reset**: 스테이징에 남겨둠.
  ```bash
  git reset --soft <commit_id>
  ```
- **Mixed Reset**: 작업 폴더에 남겨둠.
  ```bash
  git reset --mixed <commit_id>
  ```
- **Hard Reset**: 완전히 삭제.
  ```bash
  git reset --hard <commit_id>
  ```

---

## 4. Stash 사용법
- 작업 중인 내용을 잠시 저장:
  ```bash
  git stash
  ```
- Stash 목록 확인:
  ```bash
  git stash list
  ```
- 특정 메시지와 함께 Stash:
  ```bash
  git stash save "message"
  ```
- 최근 Stash 복원:
  ```bash
  git stash pop
  ```
- 특정 Stash 삭제:
  ```bash
  git stash drop <stash_number>
  ```
- 모든 Stash 삭제:
  ```bash
  git stash clear
  ```

---

## 5. GitHub와 원격 저장소
### 원격 저장소 주소 변수에 저장
- 로컬 저장소를 변수로 저장:
  ```bash
  git remote add <변수명> <원격저장소주소>
  ```
- 저장된 변수 목록 확인:
  ```bash
  git remote -v
  ```

### 원격 저장소로 Push
- 작업 내용을 업로드:
  ```bash
  git push -u <원격저장소주소> <로컬브랜치>
  ```
- 이후:
  ```bash
  git push
  ```

### 원격 저장소에서 Pull
- 원격 저장소에서 변경 사항 가져오기:
  ```bash
  git pull (원격저장소주소)
  ```
- 특정 브랜치만 가져오기:
  ```bash
  git pull <원격저장소주소> <branchname>
  ```

### 원격 저장소 복제
- 원격 저장소를 로컬로 복제:
  ```bash
  git clone <원격저장소주소>
  ```

---

## 6. 협업 및 브랜치 관리
### Git Flow
1. `main` 브랜치: 현재까지의 코드를 보관.
2. `develop` 브랜치: 개발용 메인 브랜치.
3. `feature` 브랜치: 새로운 기능 개발.
4. `release` 브랜치: 테스트용.
5. `hotfix` 브랜치: 긴급 수정.

### Trunk-Based Development
- `main` 브랜치 하나만 관리하며, 특정 분기마다 `feature` 브랜치를 만들어 작업 후 병합.

---

