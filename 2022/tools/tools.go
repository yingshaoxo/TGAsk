package tools

import (
	math_tool "github.com/yingshaoxo/gopython/safe_math"
)

func Check_if_two_timestamps_has_a_distance_that_bigger_than_x_seconds(timestamp1 string, timestamp2 string, x_seconds string) bool {
	distance := math_tool.Subtract_number(timestamp1, timestamp2)

	decimal_distance := math_tool.String_to_decimal(distance)
	decimal_distance = decimal_distance.Abs()

	return decimal_distance.GreaterThan(math_tool.String_to_decimal(x_seconds))
}
