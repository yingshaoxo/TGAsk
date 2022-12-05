package tests_playground

import (
	"fmt"
	"testing"
	"time"

	math_tool "github.com/yingshaoxo/gopython/safe_math"
)

func Test_timestamp(t *testing.T) {
	distance := math_tool.Subtract_number("1670213646", "1670213647")

	decimal_distance := math_tool.String_to_decimal(distance)
	decimal_distance = decimal_distance.Abs()

	fmt.Println(decimal_distance)
}

func Test_timestamp2(t *testing.T) {
	fmt.Println(time.Now().Unix())
}
