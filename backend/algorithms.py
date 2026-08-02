def insertion_sort_by_field(students: list[dict], field: str) -> None:
    """Sort a list of student dicts in place ascending by the given field."""
    for i in range(1, len(students)):
        key = students[i]
        j = i - 1
        while j >= 0 and students[j][field] > key[field]:
            students[j + 1] = students[j]
            j -= 1
        students[j + 1] = key


def binary_search_by_name(sorted_by_name_list: list[dict], name: str):
    """Return matching student record or -1 if not found."""
    low = 0
    high = len(sorted_by_name_list) - 1

    while low <= high:
        mid = low + (high - low) // 2
        mid_name = sorted_by_name_list[mid]["name"]

        if mid_name == name:
            return sorted_by_name_list[mid]
        elif mid_name < name:
            low = mid + 1
        else:
            high = mid - 1

    return -1


def format_roster_report(students: list[dict]) -> str:
    lines = []
    for student in students:
        lines.append(
            f"[Age {student['age']}] {student['name']} <{student['email']}>"
        )
    return "\n".join(lines)


def count_students_meeting_min_age(students: list[dict], min_age: int) -> int:
    count = 0
    for student in students:
        if student["age"] >= min_age:
            count += 1
    return count
