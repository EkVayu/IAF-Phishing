import platform
import subprocess
import json
import os
from pathlib import Path

def get_serial_number():
    try:
        # Command to get the serial number
        output = subprocess.check_output("wmic bios get serialnumber", shell=True).decode().strip().split("\n")
        return output[1].strip() if len(output) > 1 else ""
    except Exception as e:
        print(f"Error getting serial number: {e}")
        return ""

def get_uuid():
    try:
        # Command to get the UUID
        output = subprocess.check_output("wmic csproduct get uuid", shell=True).decode().strip().split("\n")
        return output[1].strip() if len(output) > 1 else ""
    except Exception as e:
        print(f"Error getting UUID: {e}")
        return ""

def get_mac_addresses():
    try:
        # Get the output of ipconfig /all command
        output = subprocess.check_output("ipconfig /all", shell=True).decode()
        # Extract MAC addresses from the output
        mac_addresses = []
        for line in output.splitlines():
            if "Physical Address" in line:
                mac_addresses.append(line.split(":")[-1].strip())
        return mac_addresses
    except Exception as e:
        print(f"Error getting MAC addresses: {e}")
        return []

def get_hardware_info():
    # Get hardware details
    hardware_info = {
        "system": platform.system(),  # Get the operating system type
        "machine": platform.machine(),  # Get the machine type
        "processor": platform.processor(),  # Get the processor information
        "platform_version": platform.version(),  # Get the platform version
        "serial_number": get_serial_number(),  # Get the serial number
        "uuid": get_uuid(),  # Get the UUID
        "mac_addresses": get_mac_addresses()  # Get the MAC addresses
    }
    return hardware_info

def generate_machine_id():
    # Get hardware information and concatenate it into a unique readable string
    hardware_info = get_hardware_info()
    machine_id = "_".join([hardware_info["system"], hardware_info["machine"], hardware_info["processor"],
                            hardware_info["platform_version"], str(hardware_info["mac_addresses"])])
    return machine_id, hardware_info

def get_downloads_folder():
    # Identify the path to the Downloads folder depending on the operating system
    if platform.system() == "Windows":
        downloads_path = Path(os.path.join(os.environ["USERPROFILE"], "Downloads"))
    else:
        downloads_path = Path(os.path.join(os.path.expanduser("~"), "Downloads"))
    return downloads_path

def save_to_file(machine_id, hardware_info, filename="machine_info.json"):
    # Get the path to the client's Downloads folder
    downloads_folder = get_downloads_folder()
    file_path = downloads_folder / filename  # Save in Downloads folder

    # Create the machine info data as a dictionary
    data = {
        "machine_id": machine_id,
        "hardware_info": hardware_info
    }

    # Write the data to a JSON file in the Downloads folder
    with open(file_path, "w") as f:
        json.dump(data, f)

    print(f"Machine info saved to: {file_path}")

def read_from_file(filename="machine_info.json"):
    # Get the path to the client's Downloads folder
    downloads_folder = get_downloads_folder()
    file_path = downloads_folder / filename

    # Read and load data from the file
    with open(file_path, "r") as f:
        data = json.load(f)

    return data

# Generate machine ID (without hashing) and save it to the Downloads folder
machine_id, hardware_info = generate_machine_id()
save_to_file(machine_id, hardware_info)

# Then, read the data from the file in the Downloads folder
saved_data = read_from_file()
print(f"Saved Machine Info: {saved_data}")
