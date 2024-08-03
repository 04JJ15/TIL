lst = [Y for j in range(X)] # Y로 채운 리스트 X개 만들기
lst = list(map(int, input().split())) #연속 입력 리스트
lst = [list(map(int,input().split())) for _ in range(X)] # 연속 입력 리스트 X번 반복
sorted_list = sorted(lst, key=lambda x : x[0]) # 특정 조건으로 리스트 정렬하기
