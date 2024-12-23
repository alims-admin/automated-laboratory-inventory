import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Eye, EyeOff } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";

interface ChangePassword {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangeProps {
  closeDialog: () => void;
}

const ChangePassword: React.FC<ChangeProps> = ({ closeDialog }) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const currentUserId = localStorage.getItem("authToken");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [rePasswordError, setRePasswordError] = useState("");
  const form = useForm<ChangePassword>();

  const validatePassword = (value: string) => {
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}$/;
    if (!passwordRegex.test(value)) {
      setPasswordError(
        "Password must be 8-15 characters long and include letters, numbers, and special characters"
      );
    } else {
      setPasswordError("");
    }
  };

  const validateRePassword = (value: string) => {
    if (value !== form.getValues("newPassword")) {
      setRePasswordError("Passwords do not match");
    } else {
      setRePasswordError("");
    }
  };

  const handlePasswordChange: SubmitHandler<ChangePassword> = async (
    values
  ) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }${currentUserId}/change-password?oldPassword=${encodeURIComponent(
          values.oldPassword
        )}&newPassword=${encodeURIComponent(values.newPassword)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        toast.success("Change password successful!");
        closeDialog();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to change password!");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };
  return (
    <div>
      <Toaster />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handlePasswordChange)}>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <FormField
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Old Password <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="rounded-xl w-full p-3 pr-10 border border-gray-300"
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Enter old password"
                        {...field}
                        required
                      />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    New Password <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="rounded-xl w-full p-3 pr-10 border border-gray-300"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          validatePassword(e.target.value);
                        }}
                        required
                      />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  {passwordError && <FormMessage>{passwordError}</FormMessage>}
                </FormItem>
              )}
            />

            <FormField
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm New Password <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="rounded-xl w-full p-3 pr-10 border border-gray-300"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          validateRePassword(e.target.value);
                        }}
                        required
                      />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  {rePasswordError && (
                    <FormMessage>{rePasswordError}</FormMessage>
                  )}
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ghost"
              onClick={form.handleSubmit(handlePasswordChange)}
              className="bg-teal-500 text-white hover:bg-teal-700 hover:text-white transition-colors duration-300 ease-in-out"
            >
              Reset Password
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
export default ChangePassword;
