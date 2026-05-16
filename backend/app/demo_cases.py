from typing import List
from app.models.schemas import DemoCase
from app.models.enums import Language

DEMO_CASES: List[DemoCase] = [
    DemoCase(
        id="py-type-error",
        title="Python TypeError: None + int",
        language=Language.PYTHON,
        error_type="TypeError",
        difficulty="Easy",
        description="A function adds two numbers but doesn't handle None inputs, causing a TypeError.",
        source_code='''def add(a, b):
    return a + b

def safe_divide(x, y):
    return x / y
''',
        test_code='''from source import add, safe_divide

def test_add_none():
    assert add(None, 2) == 2

def test_add_normal():
    assert add(3, 4) == 7

def test_safe_divide():
    assert safe_divide(10, 2) == 5.0
''',
    ),
    DemoCase(
        id="py-logic-error",
        title="Python Logic Error: Factorial Bug",
        language=Language.PYTHON,
        error_type="LogicError",
        difficulty="Easy",
        description="Factorial function returns 0 for n=0 instead of 1, breaking recursive calculations.",
        source_code='''def factorial(n):
    if n == 0:
        return 0
    return n * factorial(n - 1)

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
''',
        test_code='''from source import factorial, fibonacci

def test_factorial_zero():
    assert factorial(0) == 1

def test_factorial_five():
    assert factorial(5) == 120

def test_fibonacci():
    assert fibonacci(10) == 55
''',
    ),
    DemoCase(
        id="py-assertion-error",
        title="Python AssertionError: List Processing",
        language=Language.PYTHON,
        error_type="AssertionError",
        difficulty="Medium",
        description="A list filtering function has an off-by-one error and misses edge cases.",
        source_code='''def filter_positives(numbers):
    return [n for n in numbers if n > 0]

def get_max_even(numbers):
    evens = [n for n in numbers if n % 2 == 0]
    return max(evens)
''',
        test_code='''from source import filter_positives, get_max_even

def test_filter_positives():
    assert filter_positives([1, -2, 3, -4, 5]) == [1, 3, 5]

def test_filter_empty():
    assert filter_positives([]) == []

def test_max_even():
    assert get_max_even([1, 2, 3, 4, 6]) == 6

def test_max_even_empty():
    assert get_max_even([]) is None
''',
    ),
    DemoCase(
        id="py-import-error",
        title="Python ImportError: Missing Module",
        language=Language.PYTHON,
        error_type="ImportError",
        difficulty="Easy",
        description="Code imports a non-existent module. Fix by using standard library alternatives.",
        source_code='''import json_utils  # This module doesn't exist

def parse_config(config_str):
    return json_utils.loads(config_str)

def format_output(data):
    return json_utils.dumps(data, indent=2)
''',
        test_code='''from source import parse_config, format_output
import json

def test_parse_config():
    result = parse_config(\'{"key": "value"}\')
    assert result == {"key": "value"}

def test_format_output():
    data = {"name": "test"}
    result = format_output(data)
    assert "name" in result
''',
    ),
    DemoCase(
        id="py-string-parse",
        title="Python String Parsing Failure",
        language=Language.PYTHON,
        error_type="AssertionError",
        difficulty="Medium",
        description="String processing functions have incorrect parsing logic.",
        source_code='''def count_words(text):
    return len(text.split())

def reverse_words(text):
    words = text.split(" ")
    return " ".join(words)

def capitalize_words(text):
    return text.lower()
''',
        test_code='''from source import count_words, reverse_words, capitalize_words

def test_count_words():
    assert count_words("hello world foo") == 3

def test_reverse_words():
    assert reverse_words("hello world") == "world hello"

def test_capitalize_words():
    assert capitalize_words("hello world") == "Hello World"
''',
    ),
    DemoCase(
        id="java-npe",
        title="Java NullPointerException",
        language=Language.JAVA,
        error_type="NullPointerException",
        difficulty="Easy",
        description="A method calls input.trim() without null checking, causing NPE.",
        source_code='''package com.autopatch;

public class StringProcessor {

    public String processInput(String input) {
        return input.trim().toLowerCase();
    }

    public int getLength(String input) {
        return input.length();
    }
}
''',
        test_code='''package com.autopatch;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class StringProcessorTest {

    @Test
    public void testProcessNull() {
        StringProcessor sp = new StringProcessor();
        assertEquals("", sp.processInput(null));
    }

    @Test
    public void testProcessNormal() {
        StringProcessor sp = new StringProcessor();
        assertEquals("hello", sp.processInput("  Hello  "));
    }

    @Test
    public void testGetLengthNull() {
        StringProcessor sp = new StringProcessor();
        assertEquals(0, sp.getLength(null));
    }
}
''',
    ),
    DemoCase(
        id="java-assertion",
        title="Java JUnit Assertion: Off-By-One Loop",
        language=Language.JAVA,
        error_type="JUnitAssertionError",
        difficulty="Medium",
        description="A loop-based sum function has an off-by-one error in the boundary condition.",
        source_code='''package com.autopatch;

public class MathUtils {

    public int sumArray(int[] arr) {
        int sum = 0;
        for (int i = 0; i < arr.length - 1; i++) {
            sum += arr[i];
        }
        return sum;
    }

    public int countEven(int[] arr) {
        int count = 0;
        for (int n : arr) {
            if (n % 2 == 0) count++;
        }
        return count;
    }
}
''',
        test_code='''package com.autopatch;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class MathUtilsTest {

    @Test
    public void testSumArray() {
        MathUtils m = new MathUtils();
        assertEquals(15, m.sumArray(new int[]{1, 2, 3, 4, 5}));
    }

    @Test
    public void testSumEmpty() {
        MathUtils m = new MathUtils();
        assertEquals(0, m.sumArray(new int[]{}));
    }

    @Test
    public void testCountEven() {
        MathUtils m = new MathUtils();
        assertEquals(3, m.countEven(new int[]{1, 2, 3, 4, 5, 6}));
    }
}
''',
    ),
    DemoCase(
        id="java-string-parse",
        title="Java String Parsing Bug",
        language=Language.JAVA,
        error_type="JUnitAssertionError",
        difficulty="Medium",
        description="A string parser has incorrect logic for handling edge cases.",
        source_code='''package com.autopatch;

public class StringUtils {

    public String reverseString(String s) {
        return s;
    }

    public boolean isPalindrome(String s) {
        return s.equals(new StringBuilder(s).reverse().toString());
    }

    public String[] splitCSV(String csv) {
        return csv.split(",");
    }
}
''',
        test_code='''package com.autopatch;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class StringUtilsTest {

    @Test
    public void testReverse() {
        StringUtils su = new StringUtils();
        assertEquals("dlrow olleh", su.reverseString("hello world"));
    }

    @Test
    public void testPalindrome() {
        StringUtils su = new StringUtils();
        assertTrue(su.isPalindrome("racecar"));
        assertFalse(su.isPalindrome("hello"));
    }

    @Test
    public void testSplitCSV() {
        StringUtils su = new StringUtils();
        assertEquals(3, su.splitCSV("a,b,c").length);
    }
}
''',
    ),
]


def get_demo_case(case_id: str) -> DemoCase | None:
    for case in DEMO_CASES:
        if case.id == case_id:
            return case
    return None
