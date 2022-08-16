"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsNullOrWhitespace = void 0;
function IsNullOrWhitespace(input) {
    if (input === undefined || input === null)
        return true;
    return !(/[^\s]+/.test(input));
}
exports.IsNullOrWhitespace = IsNullOrWhitespace;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLFNBQWdCLGtCQUFrQixDQUFDLEtBQWM7SUFFN0MsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDdkQsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFKRCxnREFJQyJ9